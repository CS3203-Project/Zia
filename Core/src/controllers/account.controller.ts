import { Request, Response } from 'express';
import accountService, { AccountError } from '../services/account.service.js';

function fail(res: Response, error: unknown) {
  if (error instanceof AccountError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  console.error('Account error:', error);
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

/** Authenticated: (re)send the verification link to the signed-in user. */
export const sendVerificationController = async (req: Request, res: Response) => {
  try {
    const result = await accountService.sendVerificationEmail((req as any).user.id);
    res.json({
      success: true,
      message: result.alreadyVerified
        ? 'Your email is already verified.'
        : 'Verification email sent. Please check your inbox.',
      data: result,
    });
  } catch (error) {
    fail(res, error);
  }
};

/** Public: redeem a verification token from the emailed link. */
export const verifyEmailController = async (req: Request, res: Response) => {
  try {
    const token = String(req.body?.token || req.query?.token || '');
    const result = await accountService.verifyEmail(token);
    res.json({
      success: true,
      message: result.alreadyVerified
        ? 'This email was already verified.'
        : 'Your email has been verified.',
      data: result,
    });
  } catch (error) {
    fail(res, error);
  }
};

/**
 * Public: begin a password reset. Always reports success, even for unknown
 * addresses, so this can't be used to discover which emails have accounts.
 */
export const forgotPasswordController = async (req: Request, res: Response) => {
  try {
    await accountService.requestPasswordReset(String(req.body?.email || ''));
    res.json({
      success: true,
      message: 'If that email is registered, a reset link is on its way.',
    });
  } catch (error) {
    fail(res, error);
  }
};

/** Public: complete a password reset with a valid token. */
export const resetPasswordController = async (req: Request, res: Response) => {
  try {
    await accountService.resetPassword(
      String(req.body?.token || ''),
      String(req.body?.password || '')
    );
    res.json({ success: true, message: 'Your password has been reset. You can sign in now.' });
  } catch (error) {
    fail(res, error);
  }
};
