import type { Request, Response } from 'express';
import refundService, { RefundError } from '../services/refund.service.js';
import { prisma } from '../utils/database.js';

function fail(res: Response, error: unknown) {
  if (error instanceof RefundError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  console.error('Refund error:', error);
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

class RefundController {
  /** Customer: open a refund request against one of their payments. */
  async request(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { paymentId, reason } = req.body ?? {};
      if (!paymentId) {
        return res.status(400).json({ success: false, message: 'paymentId is required' });
      }
      const request = await refundService.request(userId, String(paymentId), String(reason ?? ''));
      res.status(201).json({
        success: true,
        message: 'Refund requested. An admin will review it.',
        data: request,
      });
    } catch (error) {
      fail(res, error);
    }
  }

  /** Customer: their own refund requests. */
  async listMine(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      res.json({ success: true, data: await refundService.listForUser(userId) });
    } catch (error) {
      fail(res, error);
    }
  }

  /**
   * Customer: the successful payment for a booking, so the UI knows whether a
   * refund can be requested and which payment it applies to.
   */
  async getForBooking(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const bookingId = String(req.params.bookingId);

      const payment = await prisma.payment.findFirst({
        where: { bookingId, userId, status: 'SUCCEEDED' },
        orderBy: { createdAt: 'desc' },
      });
      if (!payment) return res.json({ success: true, data: null });

      const refund = await prisma.refundRequest.findFirst({
        where: { paymentId: payment.id },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: {
          paymentId: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          gateway: payment.gateway,
          refund,
        },
      });
    } catch (error) {
      fail(res, error);
    }
  }

  /** Admin: all refund requests. */
  async listAll(req: Request, res: Response) {
    try {
      const status = req.query.status ? String(req.query.status) : undefined;
      res.json({ success: true, data: await refundService.listAll(status) });
    } catch (error) {
      fail(res, error);
    }
  }

  /** Admin: approve, refunding the customer and clawing back the provider share. */
  async approve(req: Request, res: Response) {
    try {
      const by = req.admin?.username || String(req.admin?.id ?? 'admin');
      const updated = await refundService.approve(String(req.params.id), by, req.body?.note);
      res.json({ success: true, message: 'Refund approved', data: updated });
    } catch (error) {
      fail(res, error);
    }
  }

  /** Admin: decline, leaving the payment and earnings untouched. */
  async decline(req: Request, res: Response) {
    try {
      const by = req.admin?.username || String(req.admin?.id ?? 'admin');
      const updated = await refundService.decline(String(req.params.id), by, req.body?.note);
      res.json({ success: true, message: 'Refund declined', data: updated });
    } catch (error) {
      fail(res, error);
    }
  }
}

export default new RefundController();
