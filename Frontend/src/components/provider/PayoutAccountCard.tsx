import { useEffect, useState } from 'react';
import { Landmark, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentApi, type PayoutAccount } from '../../api/paymentApi';

/**
 * Where a provider's approved payouts are sent.
 *
 * Bank details rather than card details on purpose: a card is how you take
 * money, not how you send it, and holding a card number would put the platform
 * in PCI-DSS scope for no gain. The commission split already happens at
 * settlement - this is only the destination for what the provider has earned.
 */
export default function PayoutAccountCard() {
  const [account, setAccount] = useState<PayoutAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ accountName: '', bankName: '', branch: '', accountNumber: '' });

  useEffect(() => {
    let alive = true;
    paymentApi
      .getPayoutAccount()
      .then((a) => {
        if (!alive) return;
        setAccount(a);
        if (!a) setEditing(true);
        else setForm({ accountName: a.accountName, bankName: a.bankName, branch: a.branch || '', accountNumber: '' });
      })
      .catch(() => alive && toast.error('Could not load your payout account'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const saved = await paymentApi.savePayoutAccount({
        accountName: form.accountName,
        bankName: form.bankName,
        branch: form.branch || undefined,
        accountNumber: form.accountNumber,
      });
      setAccount(saved);
      setEditing(false);
      setForm((f) => ({ ...f, accountNumber: '' }));
      toast.success('Payout account saved');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not save your payout account';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const field = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20';

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Landmark className="h-5 w-5 text-orange-600" />
        <h3 className="font-semibold text-gray-900">Payout Account</h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
        </div>
      ) : !editing && account ? (
        <div className="space-y-1 text-sm">
          <p className="font-medium text-gray-900">{account.accountName}</p>
          <p className="text-gray-600">
            {account.bankName}
            {account.branch ? ` · ${account.branch}` : ''}
          </p>
          <p className="font-mono text-gray-500">{account.accountNumberMasked}</p>
          <button
            onClick={() => setEditing(true)}
            className="mt-3 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Change account
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            className={field}
            placeholder="Account holder name"
            value={form.accountName}
            onChange={(e) => setForm({ ...form, accountName: e.target.value })}
          />
          <input
            className={field}
            placeholder="Bank name"
            value={form.bankName}
            onChange={(e) => setForm({ ...form, bankName: e.target.value })}
          />
          <input
            className={field}
            placeholder="Branch (optional)"
            value={form.branch}
            onChange={(e) => setForm({ ...form, branch: e.target.value })}
          />
          <input
            className={field}
            inputMode="numeric"
            placeholder="Account number"
            value={form.accountNumber}
            onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
          />
          <p className="text-xs text-gray-400">
            Used only to send your approved payouts. Shown to you masked after saving.
          </p>
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save account'}
            </button>
            {account && (
              <button
                onClick={() => setEditing(false)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
