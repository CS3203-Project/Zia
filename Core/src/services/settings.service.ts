import { prisma } from '../utils/database.js';

/**
 * Admin-editable platform settings.
 *
 * Each knob declares its type, default and bounds here, so a bad value can't be
 * written from the admin UI and every consumer gets a sane value even if the row
 * is missing. Previously these lived as magic numbers scattered across services —
 * the platform commission alone was hardcoded in three places in the payment
 * service, which meant changing it required a code deploy and risked the copies
 * drifting apart.
 */
export interface SettingSpec {
  key: string;
  label: string;
  description: string;
  type: 'number' | 'boolean';
  default: number | boolean;
  min?: number;
  max?: number;
  unit?: string;
  group: 'fees' | 'limits';
}

export const SETTING_SPECS: SettingSpec[] = [
  {
    key: 'platformFeePercent',
    label: 'Platform commission',
    description: 'Percentage of each payment retained by the platform. The rest is credited to the provider.',
    type: 'number',
    default: 5,
    min: 0,
    max: 50,
    unit: '%',
    group: 'fees',
  },
  {
    key: 'allowCashPayments',
    label: 'Allow cash payments',
    description: 'Let providers mark a booking as paid in cash instead of taking payment online.',
    type: 'boolean',
    default: true,
    group: 'fees',
  },
  {
    key: 'minPayoutAmount',
    label: 'Minimum withdrawal',
    description: 'Smallest balance a provider may request a payout for.',
    type: 'number',
    default: 1000,
    min: 0,
    max: 1000000,
    unit: 'LKR',
    group: 'fees',
  },
  {
    key: 'maxUploadSizeMb',
    label: 'Maximum upload size',
    description: 'Largest image a user may upload, in megabytes.',
    type: 'number',
    default: 5,
    min: 1,
    max: 50,
    unit: 'MB',
    group: 'limits',
  },
  {
    key: 'maxServiceImages',
    label: 'Images per service',
    description: 'How many photos a provider may attach to one service listing.',
    type: 'number',
    default: 5,
    min: 1,
    max: 20,
    unit: 'images',
    group: 'limits',
  },
  {
    key: 'requireProviderVerification',
    label: 'Require verified providers',
    description: 'When on, only admin-verified providers can publish services and receive bookings.',
    type: 'boolean',
    default: false,
    group: 'limits',
  },
];

const SPEC_BY_KEY = new Map(SETTING_SPECS.map((s) => [s.key, s]));

export type SettingsMap = Record<string, number | boolean>;

function parse(spec: SettingSpec, raw: string): number | boolean {
  if (spec.type === 'boolean') return raw === 'true';
  const n = Number(raw);
  return Number.isFinite(n) ? n : (spec.default as number);
}

/** Validates against the spec, so the admin UI can't persist nonsense. */
function coerce(spec: SettingSpec, value: unknown): string {
  if (spec.type === 'boolean') {
    if (typeof value !== 'boolean') throw new Error(`${spec.label} must be true or false`);
    return String(value);
  }

  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`${spec.label} must be a number`);
  if (spec.min !== undefined && n < spec.min) throw new Error(`${spec.label} must be at least ${spec.min}`);
  if (spec.max !== undefined && n > spec.max) throw new Error(`${spec.label} must be at most ${spec.max}`);
  return String(n);
}

export const settingsService = {
  /** All settings, with defaults filled in for anything never configured. */
  async getAll(): Promise<SettingsMap> {
    const rows = await prisma.platformSetting.findMany();
    const stored = new Map(rows.map((r) => [r.key, r.value]));

    const result: SettingsMap = {};
    for (const spec of SETTING_SPECS) {
      const raw = stored.get(spec.key);
      result[spec.key] = raw === undefined ? spec.default : parse(spec, raw);
    }
    return result;
  },

  async get<T extends number | boolean>(key: string): Promise<T> {
    const all = await this.getAll();
    return all[key] as T;
  },

  /** Writes only known keys, each validated against its spec. */
  async update(values: Record<string, unknown>, updatedBy?: string): Promise<SettingsMap> {
    const writes = Object.entries(values)
      .filter(([key]) => SPEC_BY_KEY.has(key))
      .map(([key, value]) => {
        const spec = SPEC_BY_KEY.get(key)!;
        const stringValue = coerce(spec, value);
        return prisma.platformSetting.upsert({
          where: { key },
          create: { key, value: stringValue, updatedBy },
          update: { value: stringValue, updatedBy },
        });
      });

    await prisma.$transaction(writes);
    return this.getAll();
  },

  /** Spec + current values, for rendering the admin form. */
  async describe() {
    const values = await this.getAll();
    return SETTING_SPECS.map((spec) => ({ ...spec, value: values[spec.key] }));
  },
};

export default settingsService;
