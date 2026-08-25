import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { accountApi } from '../../api/accountApi';

type State = 'checking' | 'ok' | 'failed';

/** Lands here from the verification email and redeems the token automatically. */
const VerifyEmail: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [state, setState] = useState<State>('checking');
  const [message, setMessage] = useState('');
  // React 18 StrictMode double-invokes effects in dev; the token is single-use,
  // so a second call would fail against an already-redeemed token.
  const redeemed = useRef(false);

  useEffect(() => {
    if (!token) {
      setState('failed');
      setMessage('This verification link is missing its token.');
      return;
    }
    if (redeemed.current) return;
    redeemed.current = true;

    accountApi
      .verifyEmail(token)
      .then((msg) => {
        setState('ok');
        setMessage(msg);
      })
      .catch((err: unknown) => {
        const m = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setState('failed');
        setMessage(m || 'This verification link is invalid or has expired.');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-xl">
        {state === 'checking' && (
          <>
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-orange-500" />
            <h1 className="text-2xl font-bold text-gray-900">Verifying your email…</h1>
          </>
        )}

        {state === 'ok' && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Email verified</h1>
            <p className="mb-6 text-gray-500">{message}</p>
            <Link
              to="/profile"
              className="inline-block rounded-xl bg-orange-600 px-5 py-3 font-medium text-white transition-colors hover:bg-orange-700"
            >
              Go to your profile
            </Link>
          </>
        )}

        {state === 'failed' && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-7 w-7 text-red-500" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Couldn&apos;t verify</h1>
            <p className="mb-6 text-gray-500">{message}</p>
            <Link
              to="/profile"
              className="inline-block rounded-xl bg-orange-600 px-5 py-3 font-medium text-white transition-colors hover:bg-orange-700"
            >
              Request a new link
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
