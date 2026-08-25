import React, { useEffect, useState } from 'react';
import { Loader2, Save, AlertCircle, Percent, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi, type PlatformSetting } from '../../api/adminApi';
import Toggle from '../shared/Toggle';

type Values = Record<string, number | boolean>;

/**
 * Admin editor for platform settings that used to be hardcoded constants — most
 * notably the commission rate, which lived in three separate places in the
 * payment service and needed a deploy to change.
 */
const PlatformSettingsSection: React.FC = () => {
  const [specs, setSpecs] = useState<PlatformSetting[]>([]);
  const [values, setValues] = useState<Values>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    adminApi
      .getSettings()
      .then((data) => {
        if (!alive) return;
        setSpecs(data);
        setValues(Object.fromEntries(data.map((s) => [s.key, s.value])));
      })
      .catch(() => alive && setError('Could not load platform settings.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const dirty = specs.some((s) => values[s.key] !== s.value);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await adminApi.updateSettings(values);
      setSpecs((prev) => prev.map((s) => ({ ...s, value: values[s.key] })));
      toast.success('Settings saved');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || 'Could not save settings.');
      toast.error(message || 'Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white py-16">
        <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
      </div>
    );
  }

  const groups: Array<{ id: PlatformSetting['group']; label: string; icon: React.ReactNode; blurb: string }> = [
    {
      id: 'fees',
      label: 'Fees & payments',
      icon: <Percent className="h-4 w-4 text-orange-600" />,
      blurb: 'Applies to new payments. Existing records keep the rate they were charged at.',
    },
    {
      id: 'limits',
      label: 'Limits & rules',
      icon: <SlidersHorizontal className="h-4 w-4 text-orange-600" />,
      blurb: 'Enforced on the server; the site also uses these to show accurate limits.',
    },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {groups.map((group) => {
        const items = specs.filter((s) => s.group === group.id);
        if (items.length === 0) return null;

        return (
          <div key={group.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                {group.icon}
                {group.label}
              </h3>
              <p className="mt-1 text-sm text-gray-500">{group.blurb}</p>
            </div>

            <div className="divide-y divide-gray-100">
              {items.map((spec) => (
                <div key={spec.key} className="flex items-start justify-between gap-6 px-6 py-5">
                  <div className="min-w-0 flex-1">
                    <label htmlFor={spec.key} className="block font-medium text-gray-900">
                      {spec.label}
                    </label>
                    <p className="mt-1 text-sm text-gray-500">{spec.description}</p>
                  </div>

                  <div className="flex-shrink-0">
                    {spec.type === 'boolean' ? (
                      <Toggle
                        checked={Boolean(values[spec.key])}
                        onChange={(next) => setValues((v) => ({ ...v, [spec.key]: next }))}
                        label={spec.label}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          id={spec.key}
                          type="number"
                          min={spec.min}
                          max={spec.max}
                          value={String(values[spec.key] ?? '')}
                          onChange={(e) =>
                            setValues((v) => ({ ...v, [spec.key]: Number(e.target.value) }))
                          }
                          className="w-24 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-right text-gray-900 transition-all hover:border-gray-300 focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        {spec.unit && (
                          <span className="w-12 text-sm text-gray-500">{spec.unit}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="flex items-center justify-end gap-3">
        {dirty && <span className="text-sm text-gray-500">You have unsaved changes</span>}
        <button
          onClick={save}
          disabled={saving || !dirty}
          className="flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-3 font-medium text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save settings
        </button>
      </div>
    </div>
  );
};

export default PlatformSettingsSection;
