import prismaPkg from '@prisma/client';
import { prisma } from '../utils/database.js';
import coreClient from './coreClient.service.js';

const { RefundStatus, PaymentStatus } = prismaPkg;

export class RefundError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = 'RefundError';
  }
}

/**
 * Customer-initiated refunds.
 *
 * Admins decide these, not providers: the provider is the counterparty to the
 * dispute, so letting them rule on it would be marking their own homework.
 */
export const refundService = {
  /** Customer opens a request against a payment they made. */
  async request(userId: string, paymentId: string, reason: string) {
    if (!reason?.trim()) throw new RefundError('Please say why you want a refund');

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new RefundError('Payment not found', 404);
    if (payment.userId !== userId) {
      throw new RefundError('You can only request a refund for your own payment', 403);
    }
    if (payment.status !== PaymentStatus.SUCCEEDED) {
      throw new RefundError('Only a completed payment can be refunded', 409);
    }

    const existing = await prisma.refundRequest.findFirst({
      where: { paymentId, status: { in: [RefundStatus.PENDING, RefundStatus.APPROVED] } },
    });
    if (existing) {
      throw new RefundError(
        existing.status === RefundStatus.APPROVED
          ? 'This payment has already been refunded'
          : 'You already have a refund request open for this payment',
        409
      );
    }

    return prisma.refundRequest.create({
      data: {
        paymentId,
        bookingId: payment.bookingId,
        userId,
        providerId: payment.providerId,
        amount: payment.amount,
        currency: payment.currency,
        reason: reason.trim(),
      },
    });
  },

  async listForUser(userId: string) {
    return prisma.refundRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  },

  async listAll(status?: string) {
    return prisma.refundRequest.findMany({
      where: status ? { status: status as prismaPkg.RefundStatus } : undefined,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 200,
    });
  },

  /**
   * Admin approves: the payment is marked refunded and the provider's share is
   * clawed back.
   *
   * The clawback can push availableBalance negative when the provider has
   * already withdrawn those funds. That's deliberate - the balance then honestly
   * reflects that they owe the platform, rather than the refund silently
   * vanishing and the books not adding up.
   */
  async approve(id: string, processedBy: string, note?: string) {
    const request = await prisma.refundRequest.findUnique({ where: { id } });
    if (!request) throw new RefundError('Refund request not found', 404);
    if (request.status !== RefundStatus.PENDING) {
      throw new RefundError(`This request is already ${request.status.toLowerCase()}`, 409);
    }

    const payment = await prisma.payment.findUnique({ where: { id: request.paymentId } });
    if (!payment) throw new RefundError('Payment not found', 404);

    const providerShare = Number(payment.providerAmount ?? 0);

    const [updated] = await prisma.$transaction([
      prisma.refundRequest.update({
        where: { id },
        data: {
          status: RefundStatus.APPROVED,
          decisionNote: note,
          processedBy,
          processedAt: new Date(),
        },
      }),
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.REFUNDED, refundedAt: new Date() },
      }),
      prisma.providerEarnings.update({
        where: { providerId: request.providerId },
        data: {
          totalEarnings: { decrement: providerShare },
          availableBalance: { decrement: providerShare },
        },
      }),
    ]);

    // Close the booking out. Isolated so a Core hiccup can't undo the refund we
    // just committed - the money side is what must not be lost.
    if (request.bookingId) {
      try {
        await coreClient.markBookingRefunded(request.bookingId);
      } catch (error) {
        console.error('Refund approved but booking could not be marked refunded:', error);
      }
    }

    return updated;
  },

  async decline(id: string, processedBy: string, note?: string) {
    const request = await prisma.refundRequest.findUnique({ where: { id } });
    if (!request) throw new RefundError('Refund request not found', 404);
    if (request.status !== RefundStatus.PENDING) {
      throw new RefundError(`This request is already ${request.status.toLowerCase()}`, 409);
    }

    return prisma.refundRequest.update({
      where: { id },
      data: {
        status: RefundStatus.DECLINED,
        decisionNote: note,
        processedBy,
        processedAt: new Date(),
      },
    });
  },
};

export default refundService;
