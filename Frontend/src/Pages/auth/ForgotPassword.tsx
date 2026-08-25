import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react';
import { accountApi } from '../../api/accountApi';

const inputClass =
  'w-full px-4 py-3 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-300';

/**
 * Start of the password-reset flow. Sign-in has always linked here; until now
 * the route didn't exist, so anyone who forgot their password was locked out.
 */
const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      await accountApi.forgotPassword(email.trim());
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-xl">
        <Link
          to="/signin"
          className="mb-6 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-orange-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to sign in
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Check your inbox</h1>
            <p className="text-gray-500">
              If <span className="font-medium text-gray-700">{email}</span> is registered, we&apos;ve
              sent a link to reset your password. It expires in an hour.
            </p>
            <p className="mt-6 text-sm text-gray-400">
              Didn&apos;t get it? Check spam, or{' '}
              <button
                onClick={() => setSent(false)}
                className="font-medium text-orange-600 hover:text-orange-700"
              >
                try another address
              </button>
              .
            </p>
          </div>
        ) : (
          <>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Forgot your password?</h1>
            <p className="mb-6 text-gray-500">
              Enter your email and we&apos;ll send you a link to choose a new one.
            </p>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={sending || !email.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 font-medium text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                Send reset link
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
