import apiClient from './axios';

export type BookingStatus = 'INQUIRY' | 'QUOTED' | 'ACCEPTED' | 'PAID' | 'COMPLETED' | 'CANCELLED';
export type PaymentMethod = 'ONLINE' | 'CASH';

export interface Booking {
  id: string;
  conversationId: string;
  serviceId: string;
  providerId: string;
  customerId: string;
  status: BookingStatus;
  price: string | number | null;
  currency: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  paymentMethod: PaymentMethod | null;
  paymentId: string | null;
  note: string | null;
  cancelReason: string | null;
  completedAt: string | null;
  service: {
    id: string; title: string | null; images: string[]; price: string | number; currency: string;
    address: string | null; city: string | null; latitude: number | null; longitude: number | null;
  };
  provider: { id: string; userId: string; user: BookingParty };
  customer: BookingParty;
}

export interface BookingParty {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  location: string | null;
}

export interface QuoteInput {
  price: number;
  currency?: string;
  scheduledStart: string;
  scheduledEnd: string;
  note?: string;
}

const unwrap = (res: { data: { success: boolean; data: Booking } }) => res.data.data;

export const bookingApi = {
  /** Loads (creating on first open) the booking attached to a conversation. */
  async getByConversation(conversationId: string): Promise<Booking> {
    return unwrap(await apiClient.get(`/bookings/conversation/${conversationId}`));
  },

  /**
   * The caller's still-open booking for a service, or null when there isn't one
   * (including when the last one finished - that's what allows re-booking).
   */
  async findActive(serviceId: string): Promise<Booking | null> {
    const res = await apiClient.get(`/bookings/active/${serviceId}`);
    return res.data.data ?? null;
  },

  /** Provider: propose or revise price + schedule. */
  async quote(conversationId: string, input: QuoteInput): Promise<Booking> {
    return unwrap(await apiClient.post(`/bookings/conversation/${conversationId}/quote`, input));
  },

  /** Customer: accept the quote. */
  async accept(conversationId: string): Promise<Booking> {
    return unwrap(await apiClient.post(`/bookings/conversation/${conversationId}/accept`));
  },

  /** Provider: record an off-platform cash payment. */
  async markCashPaid(conversationId: string): Promise<Booking> {
    return unwrap(await apiClient.post(`/bookings/conversation/${conversationId}/cash-paid`));
  },

  /** Provider: mark the work delivered. Unlocks reviews for both sides. */
  async complete(conversationId: string): Promise<Booking> {
    return unwrap(await apiClient.post(`/bookings/conversation/${conversationId}/complete`));
  },

  async cancel(conversationId: string, reason?: string): Promise<Booking> {
    return unwrap(await apiClient.post(`/bookings/conversation/${conversationId}/cancel`, { reason }));
  },
};

export interface BookingTimelineEntry {
  bookingId: string;
  conversationId: string;
  status: BookingStatus;
  price: string | number | null;
  currency: string;
  scheduledStart: string | null;
  service: { id: string; title: string | null; images: string[] };
  role: 'CUSTOMER' | 'PROVIDER';
  lastActivityAt: string;
  events: Array<{
    id: string;
    event: string;
    status: BookingStatus;
    message: string;
    createdAt: string;
    byMe: boolean;
  }>;
}

/** How many bookings are waiting on the caller to act. Drives the bell badge. */
export async function getBookingAttentionCount(): Promise<number> {
  const res = await apiClient.get('/bookings/attention-count');
  return res.data?.data?.count ?? 0;
}

/** The caller's booking activity, grouped per booking, newest booking first. */
export async function getBookingTimeline(): Promise<BookingTimelineEntry[]> {
  const res = await apiClient.get('/bookings/timeline');
  return res.data.data ?? [];
}

/** Human-readable label + tone for a status, shared by the panel and badges. */
export const STATUS_META: Record<BookingStatus, { label: string; tone: 'neutral' | 'active' | 'done' | 'error' }> = {
  INQUIRY:   { label: 'Enquiry',   tone: 'neutral' },
  QUOTED:    { label: 'Quote sent', tone: 'active' },
  ACCEPTED:  { label: 'Accepted',  tone: 'active' },
  PAID:      { label: 'Paid',      tone: 'active' },
  COMPLETED: { label: 'Completed', tone: 'done' },
  CANCELLED: { label: 'Cancelled', tone: 'error' },
};

export const BOOKING_STEPS: BookingStatus[] = ['INQUIRY', 'QUOTED', 'ACCEPTED', 'PAID', 'COMPLETED'];

export default bookingApi;
