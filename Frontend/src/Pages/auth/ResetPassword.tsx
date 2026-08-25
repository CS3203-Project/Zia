import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { accountApi } from '../../api/accountApi';

const inputClass =
  'w-full px-4 py-3 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-300';

/** Completes a password reset using the one-time token from the emailed link. */
const ResetPassword: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = password.length >= 8 && confirm === password && !!token;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await accountApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/signin'), 2500);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || 'Could not reset your password. The link may have expired.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-xl">
        {!token ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-7 w-7 text-red-500" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Link isn&apos;t valid</h1>
            <p className="mb-6 text-gray-500">
              This reset link is missing its token. Request a fresh one to continue.
            </p>
            <Link
              to="/forgot"
              className="inline-block rounded-xl bg-orange-600 px-5 py-3 font-medium text-white transition-colors hover:bg-orange-700"
            >
              Request a new link
            </Link>
          </div>
        ) : done ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Password updated</h1>
            <p className="text-gray-500">Taking you to sign in…</p>
          </div>
        ) : (
          <>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Choose a new password</h1>
            <p className="mb-6 text-gray-500">Make it at least 8 characters.</p>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                  New password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="password"
                    type={show ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className={`${inputClass} pl-10 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {tooShort && (
                  <p className="mt-1.5 text-xs text-red-500">Must be at least 8 characters.</p>
                )}
              </div>

              <div>
                <label htmlFor="confirm" className="mb-2 block text-sm font-medium text-gray-700">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="confirm"
                    type={show ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat your new password"
                    className={`${inputClass} pl-10`}
                  />
                </div>
                {mismatch && <p className="mt-1.5 text-xs text-red-500">Passwords don&apos;t match.</p>}
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={saving || !canSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 font-medium text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Reset password
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
