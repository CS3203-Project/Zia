import { Router } from 'express';
import paymentController from '../controllers/payment.controller.js';
import internalMiddleware from '../middlewares/internal.middleware.js';

const router: Router = Router();

router.use(internalMiddleware);

// Core calls this when a provider marks a booking as paid in cash.
router.post('/payments/cash', paymentController.recordCashPayment);

export default router;
