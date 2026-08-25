const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment:3002';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

/**
 * Records a cash-in-hand payment in the Payment service so it lands in payment
 * history and provider earnings, exactly like an online payment would.
 */
export async function recordCashPayment(input: {
  bookingId: string;
  serviceId: string;
  providerId: string;
  userId: string;
  amount: number;
  currency?: string;
}): Promise<void> {
  const response = await fetch(`${PAYMENT_SERVICE_URL}/internal/payments/cash`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-key': INTERNAL_API_KEY,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Payment service rejected cash payment: ${response.status}`);
  }
}

export default { recordCashPayment };
