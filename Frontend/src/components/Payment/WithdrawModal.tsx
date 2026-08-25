import React, { useEffect, useState } from 'react';
import { X, Banknote, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentApi } from '../../api/paymentApi';
import { currencyConfig } from '../../services/paymentConfig';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableBalance: number;
  currency: string;
}

const inputClass =
  'w-full px-4 py-3 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-300';

/** Requests a withdrawal of the provider's available balance. */
const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen, onClose, onSuccess, availableBalance, currency,
}) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [note, setNote] = useState('');
  const [minimum, setMinimum] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setAmount('');
    setMethod('');
    setNote('');
    setError(null);
    paymentApi
      .getPayoutEarnings()
      .then((e) => setMinimum(Number(e.minimumPayout) || 0))
      .catch(() => setMinimum(0));
  }, [isOpen]);

  if (!isOpen) return null;

  const value = Number(amount);
  const tooSmall = amount !== '' && value < minimum;
  const tooLarge = value > availableBalance;
  const canSubmit = value > 0 && !tooSmall && !tooLarge && method.trim().length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await paymentApi.requestPayout({ amount: value, payoutMethod: method.trim(), note: note.trim() || undefined });
      toast.success('Withdrawal requested');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || 'Could not request the withdrawal. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24 sm:items-center sm:pt-4">
      <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative my-auto flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-6 py-5">
          <h2 className="flex items-center text-lg font-bold text-gray-900">
            <Banknote className="mr-2 h-5 w-5 text-orange-600" />
            Withdraw funds
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-6">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Available to withdraw</p>
            <p className="text-2xl font-bold text-gray-900">
              {currencyConfig.formatCurrency(availableBalance, currency)}
            </p>
            {minimum > 0 && (
              <p className="mt-1 text-xs text-gray-400">
                Minimum withdrawal {currencyConfig.formatCurrency(minimum, currency)}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="amount" className="mb-2 block text-sm font-medium text-gray-700">
              Amount
            </label>
            <input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
            {tooSmall && (
              <p className="mt-1.5 text-xs text-red-500">
                Minimum withdrawal is {currencyConfig.formatCurrency(minimum, currency)}.
              </p>
            )}
            {tooLarge && (
              <p className="mt-1.5 text-xs text-red-500">
                That&apos;s more than your available balance.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="method" className="mb-2 block text-sm font-medium text-gray-700">
              Where should we send it?
            </label>
            <input
              id="method"
              type="text"
              required
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              placeholder="Bank name and account number"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="note" className="mb-2 block text-sm font-medium text-gray-700">
              Note <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              id="note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything the admin should know"
              className={inputClass}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <p className="text-xs text-gray-400">
            The amount is held while an admin reviews your request. If it&apos;s declined, it
            returns to your available balance.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 font-medium text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WithdrawModal;
