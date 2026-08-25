import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Banknote, Check, X, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi, type AdminPayoutRequest } from '../../api/adminApi';
import { currencyConfig } from '../../services/paymentConfig';

const TABS = [
  { key: 'PENDING', label: 'Awaiting review' },
  { key: 'PAID', label: 'Paid' },
  { key: 'REJECTED', label: 'Declined' },
] as const;

/**
 * Review queue for provider withdrawals. Approving records the payout; declining
 * returns the reserved amount to the provider's available balance.
 */
const PayoutRequestsSection: React.FC = () => {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('PENDING');
  const [rows, setRows] = useState<AdminPayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .getPayouts(tab)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, action: 'approve' | 'reject') => {
    let reason: string | undefined;
    if (action === 'reject') {
      // The provider sees this, so make it explain the decision.
      reason = window.prompt('Why are you declining this withdrawal?') ?? undefined;
      if (reason === undefined) return;
    }

    setBusyId(id);
    try {
      if (action === 'approve') {
        await adminApi.approvePayout(id);
        toast.success('Marked as paid');
      } else {
        await adminApi.rejectPayout(id, reason);
        toast.success('Declined — funds returned to the provider');
      }
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Could not update this request');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
              tab === t.key
                ? 'bg-orange-500 text-white shadow-sm'
                : 'border border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-orange-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4">
          <Banknote className="h-4 w-4 text-orange-600" />
          <h3 className="text-lg font-bold text-gray-900">Withdrawal requests</h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Inbox className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-gray-500">Nothing here right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {rows.map((r) => (
              <div key={r.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-gray-900">
                    {currencyConfig.formatCurrency(Number(r.amount), r.currency)}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-gray-500">
                    Provider {r.providerId}
                  </p>
                  {r.payoutMethod && (
                    <p className="mt-1 text-sm text-gray-600">Send to: {r.payoutMethod}</p>
                  )}
                  {r.note && <p className="mt-1 text-sm text-gray-500 italic">“{r.note}”</p>}
                  <p className="mt-1 text-xs text-gray-400">
                    Requested {new Date(r.createdAt).toLocaleString()}
                    {r.processedAt && ` · handled ${new Date(r.processedAt).toLocaleString()}`}
                    {r.processedBy && ` by ${r.processedBy}`}
                  </p>
                  {r.rejectReason && (
                    <p className="mt-1 text-xs text-red-500">Reason: {r.rejectReason}</p>
                  )}
                </div>

                {r.status === 'PENDING' && (
                  <div className="flex flex-shrink-0 gap-2">
                    <button
                      onClick={() => act(r.id, 'reject')}
                      disabled={busyId === r.id}
                      className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      Decline
                    </button>
                    <button
                      onClick={() => act(r.id, 'approve')}
                      disabled={busyId === r.id}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {busyId === r.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Mark paid
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PayoutRequestsSection;
