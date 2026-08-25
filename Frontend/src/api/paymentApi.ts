import { paymentApiClient } from './axios';

// Payment Types
export interface PayHereCheckoutFields {
  sandbox: boolean;
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  amount: string;
  currency: string;
  hash: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  custom_1: string;
}

export interface PayHereCheckoutResponse {
  paymentId: string;
  orderId: string;
  payhereFields: PayHereCheckoutFields;
}

export interface CreateCheckoutRequest {
  serviceId: string;
  /** Booking being paid for, so the backend can move it to PAID on settlement. */
  bookingId?: string;
  amount: number;
  currency?: string;
}

export interface Payment {
  id: string;
  serviceId: string;
  providerId: string;
  userId: string;
  gateway: string;
  payhereOrderId?: string;
  payherePaymentId?: string;
  amount: number;
  platformFee?: number;
  providerAmount?: number;
  currency: string;
  status: PaymentStatus;
  paidAt?: string;
  refundedAt?: string;
  failureReason?: string;
  metadata?: Record<string, string | number | boolean>;
  createdAt: string;
  updatedAt: string;
  service?: {
    id: string;
    title?: string;
    price: number;
  };
  provider?: {
    id: string;
    name?: string;
    user?: {
      firstName?: string;
      lastName?: string;
      email?: string;
    };
  };
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export interface ProviderEarnings {
  id: string;
  providerId: string;
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  currency: string;
  lastPayoutAt?: string;
  createdAt: string;
  updatedAt: string;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export interface RefundRequest {
  reason?: string;
  amount?: number; // For partial refunds
}

export interface PaymentHistoryResponse {
  payments: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export type PayoutStatus = 'PENDING' | 'PAID' | 'REJECTED';

export interface PayoutRequest {
  id: string;
  providerId: string;
  amount: string | number;
  currency: string;
  status: PayoutStatus;
  payoutMethod?: string | null;
  note?: string | null;
  rejectReason?: string | null;
  processedAt?: string | null;
  createdAt: string;
}

export interface EarningsWithLimits extends ProviderEarnings {
  minimumPayout: number;
}

// Payment API Service
export const paymentApi = {
  /** Provider balance plus the minimum withdrawal the platform allows. */
  getPayoutEarnings: async (): Promise<EarningsWithLimits> => {
    const response = await paymentApiClient.get('/payments/payouts/earnings');
    return response.data.success ? response.data.data : response.data;
  },

  /** Request a withdrawal. The amount is reserved until an admin reviews it. */
  requestPayout: async (data: {
    amount: number;
    payoutMethod?: string;
    note?: string;
  }): Promise<PayoutRequest> => {
    const response = await paymentApiClient.post('/payments/payouts', data);
    return response.data.success ? response.data.data : response.data;
  },

  getMyPayouts: async (): Promise<PayoutRequest[]> => {
    const response = await paymentApiClient.get('/payments/payouts');
    return response.data.success ? response.data.data : response.data;
  },

  // Create a PayHere checkout payload
  createCheckout: async (data: CreateCheckoutRequest): Promise<PayHereCheckoutResponse> => {
    const response = await paymentApiClient.post('/payments/checkout', data);
    return response.data.success ? response.data.data : response.data;
  },

  // Get payment status
  getPaymentStatus: async (paymentId: string): Promise<Payment> => {
    const response = await paymentApiClient.get(`/payments/status/${paymentId}`);
    return response.data.success ? response.data.data : response.data;
  },

  // Get user payment history
  getPaymentHistory: async (page: number = 1, limit: number = 10): Promise<PaymentHistoryResponse> => {
    const response = await paymentApiClient.get(`/payments/history?page=${page}&limit=${limit}`);
    return response.data.success ? response.data.data : response.data;
  },

  // Refund a payment (Provider/Admin only)
  refundPayment: async (paymentId: string, data?: RefundRequest): Promise<Payment> => {
    const response = await paymentApiClient.post(`/payments/refund/${paymentId}`, data || {});
    return response.data.success ? response.data.data : response.data;
  },

  // Get provider earnings (Provider only)
  getProviderEarnings: async (): Promise<ProviderEarnings> => {
    const response = await paymentApiClient.get('/payments/earnings');
    return response.data.success ? response.data.data : response.data;
  },
};

export default paymentApi;
