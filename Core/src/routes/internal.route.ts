import { Router } from 'express';
import internalController from '../controllers/internal.controller.js';
import internalMiddleware from '../middlewares/internal.middleware.js';
import { markOnlinePaidController } from '../controllers/booking.controller.js';
import { getInternalSettingsController } from '../controllers/settings.controller.js';

const router: Router = Router();

router.use(internalMiddleware);

// Called by the payment service once PayHere confirms an online payment.
router.post('/bookings/mark-paid', markOnlinePaidController);

// Platform settings (commission rate etc.) for the payment service.
router.get('/settings', getInternalSettingsController);

router.get('/users/:id', internalController.getUser);
router.get('/services/:id', internalController.getService);
router.get('/providers/by-user/:userId', internalController.getProviderByUserId);
router.get('/providers/:id', internalController.getProvider);
router.get('/admins/:id', internalController.getAdmin);

export default router;
