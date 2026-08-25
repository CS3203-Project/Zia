import { Request, Response } from 'express';
import payhereService from '../services/payhere.service.js';
import coreClient from '../services/coreClient.service.js';

export class PaymentController {
  /**
   * Create a PayHere checkout payload
   */
  async createCheckout(req: Request, res: Response) {
    try {
      const { serviceId, amount, currency = 'lkr', bookingId } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      if (!serviceId || !amount) {
        return res.status(400).json({ success: false, message: 'Service ID and amount are required' });
      }

      const service = await coreClient.getService(serviceId);

      if (!service) {
        return res.status(404).json({ success: false, message: 'Service not found' });
      }

      const checkout = await payhereService.createCheckoutPayload(
        serviceId,
        service.providerId,
        userId,
        amount,
        currency,
        bookingId
      );

      res.status(200).json({
        success: true,
        message: 'Checkout created successfully',
        data: checkout,
      });
    } catch (error) {
      console.error('Error creating checkout:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create checkout',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(req: Request, res: Response) {
    try {
      const paymentId = String(req.params.paymentId);
      const payment = await payhereService.getPaymentStatus(paymentId);

      res.status(200).json({
        success: true,
        message: 'Payment status retrieved successfully',
        data: payment,
      });
    } catch (error) {
      console.error('Error getting payment status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get user's (or provider's) payment history
   */
  async getPaymentHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { page = 1, limit = 10 } = req.query;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      const provider = await coreClient.getProviderByUserId(userId);
      const filter = provider ? { providerId: provider.id } : { userId };

      const { payments, total } = await payhereService.getPaymentHistory(filter, Number(page), Number(limit));

      res.status(200).json({
        success: true,
        message: 'Payment history retrieved successfully',
        data: {
          payments,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error('Error getting payment history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment history',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Refund payment (provider who owns the booking, or admin)
   */
  async refundPayment(req: Request, res: Response) {
    try {
      const paymentId = String(req.params.paymentId);
      const { amount, reason } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      const payment = await payhereService.getPaymentStatus(paymentId);
      const [provider, user] = await Promise.all([
        coreClient.getProvider(payment.providerId),
        coreClient.getUser(userId),
      ]);

      const isProvider = provider?.userId === userId;
      const isAdmin = user?.role === 'ADMIN';

      if (!isProvider && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Insufficient permissions to refund this payment' });
      }

      const refundData = await payhereService.refundPayment(paymentId, amount, reason);

      res.status(200).json({
        success: true,
        message: 'Payment refunded successfully',
        data: refundData,
      });
    } catch (error) {
      console.error('Error refunding payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to refund payment',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get provider earnings
   */
  async getProviderEarnings(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      const provider = await coreClient.getProviderByUserId(userId);

      if (!provider) {
        return res.status(404).json({ success: false, message: 'Service provider not found' });
      }

      const earnings = await payhereService.getProviderEarnings(provider.id);

      res.status(200).json({
        success: true,
        message: 'Provider earnings retrieved successfully',
        data: earnings,
      });
    } catch (error) {
      console.error('Error getting provider earnings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get provider earnings',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PayHere notify_url (server-to-server IPN) — public, verified via md5sig in the body
   */
  async handleNotify(req: Request, res: Response) {
    try {
      const body = req.body;
      const valid = payhereService.verifyNotifySignature(body);

      if (!valid) {
        return res.status(400).send('Invalid signature');
      }

      await payhereService.handleNotify(body);
      res.status(200).send('OK');
    } catch (error) {
      console.error('Error handling PayHere notify:', error);
      res.status(400).send('Notify handling failed');
    }
  }
}

export default new PaymentController();
