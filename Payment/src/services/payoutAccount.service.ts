import { prisma } from '../utils/database.js';

/**
 * Payout destinations.
 *
 * The platform's cut is already taken at settlement - a payment is split into
 * platformFee and providerAmount, and only providerAmount reaches the
 * provider's balance. This is the missing half: where that balance is sent.
 */

/** Shows only the last four digits, so a leaked response is not a usable account. */
export function maskAccountNumber(accountNumber: string): string {
  const digits = accountNumber.replace(/\s+/g, '');
  if (digits.length <= 4) return '*'.repeat(digits.length);
  return `${'*'.repeat(digits.length - 4)}${digits.slice(-4)}`;
}

export interface PayoutAccountInput {
  accountName: string;
  bankName: string;
  branch?: string;
  accountNumber: string;
}

export const upsertPayoutAccount = async (providerId: string, input: PayoutAccountInput) => {
  const accountNumber = input.accountNumber.replace(/\s+/g, '');

  // Loose on format because local bank account numbers vary in length, strict on
  // "is this plausibly an account number at all".
  if (!/^\d{6,20}$/.test(accountNumber)) {
    const err = new Error('Account number must be 6-20 digits') as Error & { status?: number };
    err.status = 400;
    throw err;
  }
  if (!input.accountName?.trim() || !input.bankName?.trim()) {
    const err = new Error('Account holder name and bank are required') as Error & { status?: number };
    err.status = 400;
    throw err;
  }

  const data = {
    accountName: input.accountName.trim(),
    bankName: input.bankName.trim(),
    branch: input.branch?.trim() || null,
    accountNumber,
  };

  const saved = await prisma.payoutAccount.upsert({
    where: { providerId },
    create: { providerId, ...data },
    update: data,
  });

  return toSafe(saved);
};

export const getPayoutAccount = async (providerId: string) => {
  const account = await prisma.payoutAccount.findUnique({ where: { providerId } });
  return account ? toSafe(account) : null;
};

/**
 * Full number, for the admin actually making the transfer. Kept as its own
 * function so the masked shape stays the default everywhere else and revealing
 * it is always a deliberate call.
 */
export const getPayoutAccountForTransfer = async (providerId: string) => {
  return prisma.payoutAccount.findUnique({ where: { providerId } });
};

function toSafe(account: {
  id: string;
  providerId: string;
  accountName: string;
  bankName: string;
  branch: string | null;
  accountNumber: string;
  updatedAt: Date;
}) {
  return {
    id: account.id,
    providerId: account.providerId,
    accountName: account.accountName,
    bankName: account.bankName,
    branch: account.branch,
    accountNumberMasked: maskAccountNumber(account.accountNumber),
    updatedAt: account.updatedAt,
  };
}
