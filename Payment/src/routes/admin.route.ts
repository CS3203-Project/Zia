import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import payoutController from '../controllers/payout.controller.js';
import refundController from '../controllers/refund.controller.js';
import { adminAuthMiddleware } from '../middlewares/admin.middleware.js';

const router: Router = Router();

// Provider withdrawal requests: review, mark paid, or decline (which returns
// the reserved funds to the provider's available balance).
// Refund disputes. Decided by admins rather than providers, who are the
// counterparty to the dispute.
router.get('/refunds', adminAuthMiddleware, refundController.listAll);
router.post('/refunds/:id/approve', adminAuthMiddleware, refundController.approve);
router.post('/refunds/:id/decline', adminAuthMiddleware, refundController.decline);

router.get('/payouts', adminAuthMiddleware, payoutController.listAll);
router.post('/payouts/:id/approve', adminAuthMiddleware, payoutController.approve);
router.post('/payouts/:id/reject', adminAuthMiddleware, payoutController.reject);

router.get('/analytics/payments', adminAuthMiddleware, adminController.getPaymentAnalytics);
router.get('/analytics/revenue-chart', adminAuthMiddleware, adminController.getRevenueChart);
router.get('/analytics/top-providers', adminAuthMiddleware, adminController.getTopProviders);
router.get('/analytics/recent-payments', adminAuthMiddleware, adminController.getRecentPayments);
router.get('/analytics/payment-statistics', adminAuthMiddleware, adminController.getPaymentStatistics);

export default router;
