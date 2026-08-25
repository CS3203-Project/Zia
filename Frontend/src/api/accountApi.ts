import apiClient from './axios';

/**
 * Account recovery and email verification.
 *
 * These endpoints deliberately don't reveal whether an address is registered —
 * forgot-password always reports success — so don't surface "no such user" here.
 */
export const accountApi = {
  async forgotPassword(email: string): Promise<string> {
    const res = await apiClient.post('/account/forgot-password', { email });
    return res.data?.message ?? 'If that email is registered, a reset link is on its way.';
  },

  async resetPassword(token: string, password: string): Promise<string> {
    const res = await apiClient.post('/account/reset-password', { token, password });
    return res.data?.message ?? 'Your password has been reset.';
  },

  async verifyEmail(token: string): Promise<string> {
    const res = await apiClient.post('/account/verify-email', { token });
    return res.data?.message ?? 'Your email has been verified.';
  },

  /** Authenticated: request a fresh verification link. */
  async sendVerification(): Promise<string> {
    const res = await apiClient.post('/account/send-verification');
    return res.data?.message ?? 'Verification email sent.';
  },
};

export default accountApi;
