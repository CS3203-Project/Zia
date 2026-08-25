import prismaPkg from '@prisma/client';
import { prisma } from '../utils/database.js';
import coreClient from './coreClient.service.js';

const { PayoutStatus } = prismaPkg;

export class PayoutError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = 'PayoutError';
  }
}

const DEFAULT_MIN_PAYOUT = 1000;

/**
 * Provider withdrawals.
 *
 * Balances move as a small ledger so money is never in two places at once:
 *
 *   request   availableBalance -> pendingBalance   (reserved while under review)
 *   approve   pendingBalance   -> totalWithdrawn   (paid out off-platform)
 *   reject    pendingBalance   -> availableBalance (returned to the provider)
 *
 * Every move happens in a transaction with the request's own status change, so a
 * crash can't leave the reservation and the request disagreeing.
 */
export const payoutService = {
  async getMinimumPayout(): Promise<number> {
    const settings = await coreClient.getSettings();
    const min = Number(settings.minPayoutAmount);
    return Number.isFinite(min) ? min : DEFAULT_MIN_PAYOUT;
  },

  async getEarnings(providerId: string) {
    const earnings = await prisma.providerEarnings.findUnique({ where: { providerId } });
    return (
      earnings ?? {
        providerId,
        totalEarnings: 0,
        availableBalance: 0,
        pendingBalance: 0,
        totalWithdrawn: 0,
        currency: 'lkr',
      }
    );
  },

  /** Provider asks to withdraw. The amount is reserved immediately. */
  async requestPayout(providerId: string, amount: number, payoutMethod?: string, note?: string) {
    if (!(amount > 0)) throw new PayoutError('Enter an amount greater than zero');

    const minimum = await this.getMinimumPayout();
    if (amount < minimum) {
      throw new PayoutError(`The minimum withdrawal is ${minimum}`);
    }

    const earnings = await prisma.providerEarnings.findUnique({ where: { providerId } });
    const available = Number(earnings?.availableBalance ?? 0);

    if (available < amount) {
      throw new PayoutError(
        `You can withdraw up to ${available.toFixed(2)} right now`
      );
    }

    // Reserve and record together: a partial failure here would either hand out
    // the same balance twice or strand funds with no request attached to them.
    const [request] = await prisma.$transaction([
      prisma.payoutRequest.create({
        data: {
          providerId,
          amount,
          currency: earnings?.currency ?? 'lkr',
          payoutMethod,
          note,
          status: PayoutStatus.PENDING,
        },
      }),
      prisma.providerEarnings.update({
        where: { providerId },
        data: {
          availableBalance: { decrement: amount },
          pendingBalance: { increment: amount },
        },
      }),
    ]);

    return request;
  },

  async listForProvider(providerId: string) {
    return prisma.payoutRequest.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  },

  async listAll(status?: string) {
    return prisma.payoutRequest.findMany({
      where: status ? { status: status as prismaPkg.PayoutStatus } : undefined,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 200,
    });
  },

  /** Admin marks a request as paid: the reservation becomes a withdrawal. */
  async approve(id: string, processedBy: string) {
    const request = await prisma.payoutRequest.findUnique({ where: { id } });
    if (!request) throw new PayoutError('Payout request not found', 404);
    if (request.status !== PayoutStatus.PENDING) {
      throw new PayoutError(`This request is already ${request.status.toLowerCase()}`, 409);
    }

    const [updated] = await prisma.$transaction([
      prisma.payoutRequest.update({
        where: { id },
        data: { status: PayoutStatus.PAID, processedBy, processedAt: new Date() },
      }),
      prisma.providerEarnings.update({
        where: { providerId: request.providerId },
        data: {
          pendingBalance: { decrement: request.amount },
          totalWithdrawn: { increment: request.amount },
          lastPayoutAt: new Date(),
        },
      }),
    ]);

    return updated;
  },

  /** Admin declines: the reserved amount goes back to the provider's balance. */
  async reject(id: string, processedBy: string, reason?: string) {
    const request = await prisma.payoutRequest.findUnique({ where: { id } });
    if (!request) throw new PayoutError('Payout request not found', 404);
    if (request.status !== PayoutStatus.PENDING) {
      throw new PayoutError(`This request is already ${request.status.toLowerCase()}`, 409);
    }

    const [updated] = await prisma.$transaction([
      prisma.payoutRequest.update({
        where: { id },
        data: {
          status: PayoutStatus.REJECTED,
          rejectReason: reason,
          processedBy,
          processedAt: new Date(),
        },
      }),
      prisma.providerEarnings.update({
        where: { providerId: request.providerId },
        data: {
          pendingBalance: { decrement: request.amount },
          availableBalance: { increment: request.amount },
        },
      }),
    ]);

    return updated;
  },
};

export default payoutService;
