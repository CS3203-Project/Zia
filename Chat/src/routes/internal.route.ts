import { Router } from 'express';
import internalController from '../controllers/internal.controller.js';
import internalMiddleware from '../middlewares/internal.middleware.js';

const router: Router = Router();

router.use(internalMiddleware);

router.get('/conversations/:id', internalController.getConversation);

export default router;
