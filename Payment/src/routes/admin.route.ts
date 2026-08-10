import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { adminAuthMiddleware } from '../middlewares/admin.middleware.js';

const router: Router = Router();

router.get('/analytics/payments', adminAuthMiddleware, adminController.getPaymentAnalytics);
router.get('/analytics/revenue-chart', adminAuthMiddleware, adminController.getRevenueChart);
router.get('/analytics/top-providers', adminAuthMiddleware, adminController.getTopProviders);
router.get('/analytics/recent-payments', adminAuthMiddleware, adminController.getRecentPayments);
router.get('/analytics/payment-statistics', adminAuthMiddleware, adminController.getPaymentStatistics);

export default router;
