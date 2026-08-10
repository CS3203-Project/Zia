import { Router } from 'express';
import internalController from '../controllers/internal.controller.js';
import internalMiddleware from '../middlewares/internal.middleware.js';

const router: Router = Router();

router.use(internalMiddleware);

router.get('/users/:id', internalController.getUser);
router.get('/services/:id', internalController.getService);
router.get('/providers/by-user/:userId', internalController.getProviderByUserId);
router.get('/providers/:id', internalController.getProvider);
router.get('/admins/:id', internalController.getAdmin);

export default router;
