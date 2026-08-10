import { Router } from 'express';
import paymentController from '../controllers/payment.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router: Router = Router();

/**
 * @route POST /api/payments/checkout
 * @desc Create a PayHere checkout payload
 * @access Private
 */
router.post('/checkout', authMiddleware, paymentController.createCheckout);

/**
 * @route GET /api/payments/status/:paymentId
 * @access Private
 */
router.get('/status/:paymentId', authMiddleware, paymentController.getPaymentStatus);

/**
 * @route GET /api/payments/history
 * @access Private
 */
router.get('/history', authMiddleware, paymentController.getPaymentHistory);

/**
 * @route POST /api/payments/refund/:paymentId
 * @access Private (Provider/Admin only)
 */
router.post('/refund/:paymentId', authMiddleware, paymentController.refundPayment);

/**
 * @route GET /api/payments/earnings
 * @access Private (Provider only)
 */
router.get('/earnings', authMiddleware, paymentController.getProviderEarnings);

/**
 * @route POST /api/payments/notify
 * @desc PayHere server-to-server IPN callback
 * @access Public (signature-verified in body)
 */
router.post('/notify', paymentController.handleNotify);

export default router;
