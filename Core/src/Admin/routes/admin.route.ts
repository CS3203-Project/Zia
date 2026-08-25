import { Router, type Router as ExpressRouter } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { adminAuthMiddleware, adminRegistrationMiddleware } from '../middlewares/admin.middleware.js';
import { validateAdminLogin, validateAdminRegistration, validateAdminUpdate, validateServiceProviderVerification } from '../validators/admin.validator.js';
import { scheduledJobsController } from '../../controllers/scheduled-jobs.controller.js';
import validate from '../../middlewares/validation.middleware.js';
import { createCategorySchema, updateCategorySchema, categoryIdSchema } from '../../validators/category.validator.js';
import { getSettingsController, updateSettingsController } from '../../controllers/settings.controller.js';
import {
  listServicesForReviewController,
  reviewServiceController,
} from '../../controllers/serviceReview.admin.controller.js';

const router: ExpressRouter = Router();

// Public routes
router.post('/login', validateAdminLogin, adminController.login);

// Open only until the first admin exists; afterwards it takes an existing admin
// to create another. It was fully unauthenticated, which let anyone who could
// reach the API mint themselves an admin and walk in through every route below.
router.post('/register', adminRegistrationMiddleware, validateAdminRegistration, adminController.register);

// Protected routes (require admin authentication)
router.get('/profile', adminAuthMiddleware, adminController.getProfile);
router.put('/profile', adminAuthMiddleware, validateAdminUpdate, adminController.updateProfile);
router.get('/all', adminAuthMiddleware, adminController.getAllAdmins);
// Listing moderation, active only when requireServiceApproval is on.
router.get('/service-review', adminAuthMiddleware, listServicesForReviewController);
router.post('/service-review/:serviceId', adminAuthMiddleware, reviewServiceController);

router.get('/settings', adminAuthMiddleware, getSettingsController);
router.put('/settings', adminAuthMiddleware, updateSettingsController);
router.get('/service-providers', adminAuthMiddleware, adminController.getAllServiceProviders);
router.get('/services', adminAuthMiddleware, adminController.getAllServicesWithCategories);
router.get('/customers/count', adminAuthMiddleware, adminController.getCustomerCount);
router.get('/customers', adminAuthMiddleware, adminController.getAllCustomers);
router.put('/service-providers/:providerId/verification', adminAuthMiddleware, validateServiceProviderVerification, adminController.updateServiceProviderVerification);

// Payment Analytics routes now live on the Payment service (see Payment/src/routes/admin.route.ts),
// reachable at the same /api/admin/analytics/* paths via a more specific ingress rule.

// Scheduled Jobs routes
router.get('/scheduled-jobs/trigger-reminder', adminAuthMiddleware, scheduledJobsController.triggerBookingReminder);
router.post('/scheduled-jobs/send-immediate-reminder', adminAuthMiddleware, scheduledJobsController.sendImmediateReminder);

// Category management routes (categories and subcategories, via parentId)
router.get('/categories', adminAuthMiddleware, adminController.getCategories);
router.post('/categories', adminAuthMiddleware, validate(createCategorySchema), adminController.createCategory);
router.put('/categories/:id', adminAuthMiddleware, validate(categoryIdSchema, 'params'), validate(updateCategorySchema), adminController.updateCategory);
router.delete('/categories/:id', adminAuthMiddleware, validate(categoryIdSchema, 'params'), adminController.deleteCategory);

export default router;
