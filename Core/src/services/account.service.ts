import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../utils/database.js';
import { queueService } from './queue.service.js';

const APP_URL = process.env.APP_URL || 'http://localhost:8080';

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export class AccountError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = 'AccountError';
  }
}

/**
 * Tokens go to the user in the clear but are stored hashed, so a database leak
 * can't be replayed to verify an address or take over an account. SHA-256 is
 * appropriate here (unlike for passwords): the token is already 32 bytes of
 * entropy, so there is nothing to brute-force.
 */
function issueToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

const hashOf = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

const displayName = (user: { firstName: string | null; lastName: string | null; email: string }) =>
  [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

export const accountService = {
  /**
   * Issues a fresh verification link. Any previous one stops working, so a
   * forwarded or intercepted older mail can't still be used.
   */
  async sendVerificationEmail(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, isEmailVerified: true },
    });
    if (!user) throw new AccountError('User not found', 404);
    if (user.isEmailVerified) return { alreadyVerified: true };

    const { token, hash } = issueToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyTokenHash: hash,
        emailVerifyExpiresAt: new Date(Date.now() + VERIFY_TTL_MS),
      },
    });

    await queueService.sendAccountEmail({
      type: 'ACCOUNT_VERIFICATION',
      to: user.email,
      name: displayName(user),
      actionUrl: `${APP_URL}/verify-email?token=${token}`,
    });

    return { alreadyVerified: false };
  },

  /** Consumes a verification token. Single-use: the hash is cleared on success. */
  async verifyEmail(token: string) {
    if (!token) throw new AccountError('Verification token is required');

    const user = await prisma.user.findFirst({
      where: { emailVerifyTokenHash: hashOf(token) },
      select: { id: true, emailVerifyExpiresAt: true, isEmailVerified: true },
    });

    if (!user) throw new AccountError('This verification link is invalid or has already been used', 400);
    if (user.isEmailVerified) return { alreadyVerified: true };
    if (!user.emailVerifyExpiresAt || user.emailVerifyExpiresAt < new Date()) {
      throw new AccountError('This verification link has expired. Please request a new one.', 410);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifyTokenHash: null,
        emailVerifyExpiresAt: null,
      },
    });

    return { alreadyVerified: false };
  },

  /**
   * Starts a password reset.
   *
   * Deliberately reports success even when the address is unknown: telling the
   * caller which emails exist would turn this into an account-enumeration oracle.
   */
  async requestPasswordReset(email: string) {
    if (!email) throw new AccountError('Email is required');

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (user) {
      const { token, hash } = issueToken();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetTokenHash: hash,
          passwordResetExpiresAt: new Date(Date.now() + RESET_TTL_MS),
        },
      });

      await queueService.sendAccountEmail({
        type: 'PASSWORD_RESET',
        to: user.email,
        name: displayName(user),
        actionUrl: `${APP_URL}/reset-password?token=${token}`,
      });
    }

    return { ok: true };
  },

  /** Completes a reset. The token is single-use and cleared once redeemed. */
  async resetPassword(token: string, newPassword: string) {
    if (!token) throw new AccountError('Reset token is required');
    if (!newPassword || newPassword.length < 8) {
      throw new AccountError('Password must be at least 8 characters long');
    }

    const user = await prisma.user.findFirst({
      where: { passwordResetTokenHash: hashOf(token) },
      select: { id: true, passwordResetExpiresAt: true },
    });

    if (!user) throw new AccountError('This reset link is invalid or has already been used', 400);
    if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      throw new AccountError('This reset link has expired. Please request a new one.', 410);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(newPassword, 10),
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        // Completing a reset proves control of the mailbox.
        isEmailVerified: true,
        emailVerifyTokenHash: null,
        emailVerifyExpiresAt: null,
      },
    });

    return { ok: true };
  },
};

export default accountService;
