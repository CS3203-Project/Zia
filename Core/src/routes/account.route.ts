import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  sendVerificationController,
  verifyEmailController,
  forgotPasswordController,
  resetPasswordController,
} from '../controllers/account.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { getPublicSettingsController } from '../controllers/settings.controller.js';

const router: Router = Router();

/**
 * These endpoints send mail and guess-check tokens, so they get their own tight
 * budget regardless of the global limiter (which is relaxed, and disabled in
 * development). Without this, /forgot-password is a free way to spam someone's
 * inbox and /reset-password is brute-forceable.
 */
const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again shortly.' },
});

// Public platform limits the client needs to enforce before uploading. Not
// secret - the server re-checks everything - and unauthenticated pages use them.
router.get('/settings', getPublicSettingsController);

router.post('/forgot-password', sensitiveLimiter, forgotPasswordController);
router.post('/reset-password', sensitiveLimiter, resetPasswordController);
router.post('/verify-email', sensitiveLimiter, verifyEmailController);
router.post('/send-verification', sensitiveLimiter, authMiddleware, sendVerificationController);

export default router;
