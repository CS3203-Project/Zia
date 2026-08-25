import React, { useState } from 'react';
import { X, Loader2, AlertCircle, Undo2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentApi } from '../../api/paymentApi';
import { currencyConfig } from '../../services/paymentConfig';

interface RefundRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  paymentId: string;
  amount: number;
  currency: string;
}

/** Lets a customer ask for their money back on a booking that went wrong. */
const RefundRequestModal: React.FC<RefundRequestModalProps> = ({
  isOpen, onClose, onSuccess, paymentId, amount, currency,
}) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await paymentApi.requestRefund(paymentId, reason.trim());
      toast.success('Refund requested');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || 'Could not submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24 sm:items-center sm:pt-4">
      <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative my-auto w-full max-w-md overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <h2 className="flex items-center text-lg font-bold text-gray-900">
            <Undo2 className="mr-2 h-5 w-5 text-orange-600" />
            Request a refund
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
            <p className="text-sm text-gray-500">Amount paid</p>
            <p className="text-2xl font-bold text-gray-900">
              {currencyConfig.formatCurrency(amount, currency)}
            </p>
          </div>

          <div>
            <label htmlFor="reason" className="mb-2 block text-sm font-medium text-gray-700">
              What went wrong?
            </label>
            <textarea
              id="reason"
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tell us what happened, so an admin can review it fairly."
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-300 hover:border-gray-300 focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <p className="text-xs text-gray-400">
            An admin reviews this — not the provider. You&apos;ll see the outcome here.
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
              disabled={submitting || reason.trim().length < 5}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 font-medium text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RefundRequestModal;
