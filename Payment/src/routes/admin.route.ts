import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import payoutController from '../controllers/payout.controller.js';
import { adminAuthMiddleware } from '../middlewares/admin.middleware.js';

const router: Router = Router();

// Provider withdrawal requests: review, mark paid, or decline (which returns
// the reserved funds to the provider's available balance).
router.get('/payouts', adminAuthMiddleware, payoutController.listAll);
router.post('/payouts/:id/approve', adminAuthMiddleware, payoutController.approve);
router.post('/payouts/:id/reject', adminAuthMiddleware, payoutController.reject);

router.get('/analytics/payments', adminAuthMiddleware, adminController.getPaymentAnalytics);
router.get('/analytics/revenue-chart', adminAuthMiddleware, adminController.getRevenueChart);
router.get('/analytics/top-providers', adminAuthMiddleware, adminController.getTopProviders);
router.get('/analytics/recent-payments', adminAuthMiddleware, adminController.getRecentPayments);
router.get('/analytics/payment-statistics', adminAuthMiddleware, adminController.getPaymentStatistics);

export default router;
