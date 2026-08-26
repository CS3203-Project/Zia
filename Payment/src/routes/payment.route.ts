import { Router } from 'express';
import paymentController from '../controllers/payment.controller.js';
import payoutController from '../controllers/payout.controller.js';
import refundController from '../controllers/refund.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router: Router = Router();

/**
 * @route GET/POST /api/payments/payouts
 * @desc Provider withdrawals. Earnings previously had no exit at all.
 * @access Private (provider)
 */
/**
 * Customer-initiated refunds. A paid booking previously had no recovery path:
 * it couldn't be cancelled and the refund endpoint was admin/provider-only.
 */
router.post('/refunds', authMiddleware, refundController.request);
router.get('/refunds', authMiddleware, refundController.listMine);
router.get('/refunds/booking/:bookingId', authMiddleware, refundController.getForBooking);

router.get('/payouts/earnings', authMiddleware, payoutController.getMyEarnings);
router.get('/payouts', authMiddleware, payoutController.listMyPayouts);
router.post('/payouts', authMiddleware, payoutController.requestPayout);

// Where approved payouts are sent. Read back masked; only the transfer path
// ever sees the full number.
router.get('/payouts/account', authMiddleware, payoutController.getAccount);
router.put('/payouts/account', authMiddleware, payoutController.saveAccount);

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
