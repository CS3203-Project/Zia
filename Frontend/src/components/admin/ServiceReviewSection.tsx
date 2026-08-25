import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, ClipboardCheck, Check, X, Inbox, ImageOff, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi, type ServiceForReview } from '../../api/adminApi';

const TABS = [
  { key: 'PENDING', label: 'Awaiting review' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
] as const;

/**
 * Listing moderation queue.
 *
 * Only does anything once "Review services before they go live" is enabled in
 * platform settings — otherwise listings publish straight away and everything
 * lands here already approved.
 */
const ServiceReviewSection: React.FC = () => {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('PENDING');
  const [rows, setRows] = useState<ServiceForReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .getServicesForReview(tab)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    let note: string | undefined;
    if (status === 'REJECTED') {
      // The provider reads this, so it needs to say what to change.
      note = window.prompt('What does the provider need to fix?') ?? undefined;
      if (note === undefined) return;
    }

    setBusyId(id);
    try {
      await adminApi.reviewService(id, status, note);
      toast.success(status === 'APPROVED' ? 'Listing approved' : 'Listing rejected');
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Could not update this listing');
    } finally {
      setBusyId(null);
    }
  };

  const providerName = (s: ServiceForReview) =>
    [s.provider?.user.firstName, s.provider?.user.lastName].filter(Boolean).join(' ') ||
    s.provider?.user.email ||
    'Unknown provider';

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
          <ClipboardCheck className="h-4 w-4 text-orange-600" />
          <h3 className="text-lg font-bold text-gray-900">Service listings</h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Inbox className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-gray-500">Nothing here right now.</p>
            {tab === 'PENDING' && (
              <p className="mt-1 text-sm text-gray-400">
                Listings only queue here while service review is switched on in settings.
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {rows.map((s) => (
              <div key={s.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:justify-between">
                <div className="flex min-w-0 flex-1 gap-4">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                    {s.images?.[0] ? (
                      <img src={s.images[0]} alt={s.title || 'Service'} className="h-full w-full object-cover" />
                    ) : (
                      <ImageOff className="h-5 w-5 text-gray-300" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{s.title || 'Untitled listing'}</h4>
                      {s.provider?.isVerified && (
                        <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                          <ShieldCheck className="h-3 w-3" />
                          Verified provider
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {providerName(s)}
                      {s.category?.name ? ` · ${s.category.name}` : ''}
                      {` · ${s.currency} ${Number(s.price).toFixed(2)}`}
                    </p>
                    {s.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600">{s.description}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-400">
                      Submitted {new Date(s.createdAt).toLocaleString()}
                      {s.reviewedAt && ` · reviewed ${new Date(s.reviewedAt).toLocaleString()}`}
                      {s.reviewedBy && ` by ${s.reviewedBy}`}
                    </p>
                    {s.reviewNote && (
                      <p className="mt-1 text-xs text-red-500">Note: {s.reviewNote}</p>
                    )}
                  </div>
                </div>

                {s.reviewStatus === 'PENDING' && (
                  <div className="flex flex-shrink-0 gap-2 sm:flex-col lg:flex-row">
                    <button
                      onClick={() => act(s.id, 'REJECTED')}
                      disabled={busyId === s.id}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => act(s.id, 'APPROVED')}
                      disabled={busyId === s.id}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {busyId === s.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Approve
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

export default ServiceReviewSection;
