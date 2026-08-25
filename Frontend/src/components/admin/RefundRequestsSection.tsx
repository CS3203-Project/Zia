import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Undo2, Check, X, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi, type AdminRefundRequest } from '../../api/adminApi';
import { currencyConfig } from '../../services/paymentConfig';

const TABS = [
  { key: 'PENDING', label: 'Awaiting review' },
  { key: 'APPROVED', label: 'Refunded' },
  { key: 'DECLINED', label: 'Declined' },
] as const;

/**
 * Refund disputes queue.
 *
 * Approving refunds the customer and claws the provider's share back out of
 * their earnings — which can leave that balance negative if they already
 * withdrew it, so the decision is worth reading properly.
 */
const RefundRequestsSection: React.FC = () => {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('PENDING');
  const [rows, setRows] = useState<AdminRefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .getRefunds(tab)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, action: 'approve' | 'decline') => {
    const verb = action === 'approve' ? 'approving' : 'declining';
    // The customer sees this, so it should explain the decision.
    const note = window.prompt(`Add a note explaining why you're ${verb} this refund:`) ?? undefined;
    if (note === undefined) return;

    setBusyId(id);
    try {
      if (action === 'approve') {
        await adminApi.approveRefund(id, note);
        toast.success('Refund approved');
      } else {
        await adminApi.declineRefund(id, note);
        toast.success('Refund declined');
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
          <Undo2 className="h-4 w-4 text-orange-600" />
          <h3 className="text-lg font-bold text-gray-900">Refund requests</h3>
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
              <div key={r.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-gray-900">
                    {currencyConfig.formatCurrency(Number(r.amount), r.currency)}
                  </p>
                  <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700 italic">
                    “{r.reason}”
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    Requested {new Date(r.createdAt).toLocaleString()}
                    {r.processedAt && ` · handled ${new Date(r.processedAt).toLocaleString()}`}
                    {r.processedBy && ` by ${r.processedBy}`}
                  </p>
                  {r.decisionNote && (
                    <p className="mt-1 text-xs text-gray-500">Note: {r.decisionNote}</p>
                  )}
                </div>

                {r.status === 'PENDING' && (
                  <div className="flex flex-shrink-0 gap-2">
                    <button
                      onClick={() => act(r.id, 'decline')}
                      disabled={busyId === r.id}
                      className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      Decline
                    </button>
                    <button
                      onClick={() => act(r.id, 'approve')}
                      disabled={busyId === r.id}
                      className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                    >
                      {busyId === r.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Refund
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

export default RefundRequestsSection;
