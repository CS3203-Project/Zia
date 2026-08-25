import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle, Clock, CreditCard, Banknote, AlertCircle, XCircle,
  CalendarClock, Loader2, Star, User as UserIcon, Navigation,
} from 'lucide-react';
import {
  bookingApi, markBookingEventsRead, BOOKING_STEPS, STATUS_META,
  type Booking, type BookingStatus,
} from '../../api/bookingApi';
import { useConfirmationSocket } from '../../hooks/useConfirmationSocket';
import { useAuth } from '../../contexts/AuthContext';
import { PaymentModal } from '../Payment';
import DirectionsModal from './DirectionsModal';
import RefundRequestModal from '../Payment/RefundRequestModal';
import { paymentApi, type BookingPaymentInfo } from '../../api/paymentApi';

interface Props {
  conversationId: string;
  currentUserRole: 'USER' | 'PROVIDER';
  onReviewClick?: () => void;
  onViewUserDetails?: () => void;
}

const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const money = (amount: string | number | null, currency: string) =>
  amount == null ? '—' : `${currency} ${Number(amount).toFixed(2)}`;

const formatWhen = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : '—');

/** Pulls the backend's message off an axios error without widening to `any`. */
const readApiError = (e: unknown): string | undefined =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message;

interface DirectionsTarget {
  label: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
}

/**
 * Where the viewer needs to travel to, once a booking is confirmed.
 *
 * The customer heads to where the service happens (its coordinates if the provider
 * pinned them, else the provider's own address); the provider heads to the
 * customer's address. Returns null when we simply don't hold an address for the
 * other party, so the button can be hidden rather than opening an empty map.
 */
function directionsTarget(booking: Booking, isProvider: boolean): DirectionsTarget | null {
  if (isProvider) {
    const dest = booking.customer.address || booking.customer.location;
    return dest ? { label: dest, address: dest } : null;
  }

  const { latitude, longitude, address, city } = booking.service;
  if (latitude != null && longitude != null) {
    return { label: address || city || 'Service location', latitude, longitude };
  }

  const dest = address || booking.provider.user.address || booking.provider.user.location;
  return dest ? { label: dest, address: dest } : null;
}

/**
 * The booking workspace inside a conversation.
 *
 * Replaces the old ConfirmationPanel, where four independently-togglable
 * checkboxes (customer/provider confirmation, fee lock, cash received) meant
 * neither party could tell what state a booking was actually in. Here the
 * booking has one status, and each party is shown exactly the one action
 * that's theirs to take next.
 */
const BookingPanel: React.FC<Props> = ({ conversationId, currentUserRole, onReviewClick, onViewUserDetails }) => {
  const { user } = useAuth();
  const isProvider = currentUserRole === 'PROVIDER';

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  // The refundable payment behind this booking, if the viewer is the customer.
  const [paymentInfo, setPaymentInfo] = useState<BookingPaymentInfo | null>(null);

  const loadPaymentInfo = useCallback((bookingId: string) => {
    paymentApi
      .getBookingPayment(bookingId)
      .then(setPaymentInfo)
      .catch(() => setPaymentInfo(null));
  }, []);

  // Quote form (provider only)
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('LKR');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [editingQuote, setEditingQuote] = useState(false);

  const syncForm = useCallback((b: Booking) => {
    setPrice(b.price != null ? String(Number(b.price)) : '');
    setCurrency(b.currency || 'LKR');
    setStart(toLocalInput(b.scheduledStart));
    setEnd(toLocalInput(b.scheduledEnd));
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    setBooking(null);
    setEditingQuote(false);

    bookingApi
      .getByConversation(conversationId)
      .then((b) => {
        if (!alive) return;
        setBooking(b);
        syncForm(b);
        // Opening the booking counts as seeing it, so the bell badge clears
        // without the user hunting for a "mark as read" button.
        markBookingEventsRead(b.id).catch(() => {});
        if (!isProvider) loadPaymentInfo(b.id);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(readApiError(e) || 'Could not load this booking');
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [conversationId, syncForm]);

  // Live updates when the other party advances the booking.
  const onRemoteUpdate = useCallback(
    (incoming: unknown) => {
      const next = incoming as Booking | null;
      if (!next?.status) return;
      setBooking(next);
      if (!editingQuote) syncForm(next);
    },
    [editingQuote, syncForm]
  );
  useConfirmationSocket(conversationId, onRemoteUpdate, user?.id || '');

  const run = async (fn: () => Promise<Booking>) => {
    setBusy(true);
    setError(null);
    try {
      const updated = await fn();
      setBooking(updated);
      syncForm(updated);
      setEditingQuote(false);
    } catch (e: unknown) {
      setError(readApiError(e) || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitQuote = () =>
    run(() =>
      bookingApi.quote(conversationId, {
        price: parseFloat(price),
        currency,
        scheduledStart: new Date(start).toISOString(),
        scheduledEnd: new Date(end).toISOString(),
      })
    );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white p-6 text-center">
        <AlertCircle className="h-8 w-8 text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">{error || 'No booking for this conversation.'}</p>
      </div>
    );
  }

  const status = booking.status as BookingStatus;
  const meta = STATUS_META[status];
  const isCancelled = status === 'CANCELLED';
  const stepIndex = BOOKING_STEPS.indexOf(status);
  const quoteFormValid = parseFloat(price) > 0 && !!start && !!end && new Date(end) > new Date(start);


  // Cancelled is included via editingQuote so the provider can revive a
  // cancelled booking with a fresh quote rather than the thread being dead.
  const showQuoteForm = isProvider && (status === 'INQUIRY' || editingQuote);
  const directions = directionsTarget(booking, isProvider);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Status header */}
      <div
        className={`px-4 py-4 border-b ${
          meta.tone === 'done'
            ? 'bg-emerald-50 border-emerald-200'
            : meta.tone === 'error'
              ? 'bg-red-50 border-red-200'
              : meta.tone === 'active'
                ? 'bg-orange-50 border-orange-200'
                : 'bg-gray-50 border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            {isCancelled ? (
              <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            ) : status === 'COMPLETED' ? (
              <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <Clock className="h-5 w-5 text-orange-500 flex-shrink-0" />
            )}
            <h3 className="text-base font-semibold text-gray-900 truncate">{meta.label}</h3>
          </div>
          {busy && <Loader2 className="h-4 w-4 animate-spin text-orange-500 flex-shrink-0" />}
        </div>

        <p className="text-xs text-gray-600 mt-1 truncate">{booking.service.title}</p>

        {/* Progress stepper */}
        {!isCancelled && (
          <div className="flex items-center gap-1 mt-3">
            {BOOKING_STEPS.map((s, i) => (
              <div
                key={s}
                title={STATUS_META[s].label}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= stepIndex ? 'bg-orange-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Agreed terms - read-only once a quote exists */}
        {(booking.price != null || booking.scheduledStart) && !showQuoteForm && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</span>
              <span className="text-base font-bold text-gray-900">{money(booking.price, booking.currency)}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CalendarClock className="h-3.5 w-3.5" /> Scheduled
              </div>
              <p className="text-sm text-gray-900">{formatWhen(booking.scheduledStart)}</p>
              <p className="text-xs text-gray-500">to {formatWhen(booking.scheduledEnd)}</p>
            </div>
            {booking.paymentMethod && (
              <div className="border-t border-gray-200 pt-3 flex items-center gap-2 text-sm text-emerald-700">
                {booking.paymentMethod === 'CASH' ? <Banknote className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                Paid via {booking.paymentMethod === 'CASH' ? 'cash' : 'card'}
              </div>
            )}
          </div>
        )}

        {/* PROVIDER: send or revise the quote */}
        {showQuoteForm && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {status === 'INQUIRY' ? 'Send a quote' : 'Revise quote'}
            </h4>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 transition-all"
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="px-3 py-2.5 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 text-gray-900 transition-all"
              >
                {['LKR', 'USD', 'EUR', 'GBP', 'INR'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs text-gray-500">Starts</label>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 transition-all"
              />
              <label className="block text-xs text-gray-500">Ends</label>
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 transition-all"
              />
            </div>
            <div className="flex gap-2">
              {editingQuote && (
                <button
                  onClick={() => { setEditingQuote(false); syncForm(booking); }}
                  disabled={busy}
                  className="flex-1 px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={submitQuote}
                disabled={busy || !quoteFormValid}
                className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'INQUIRY' ? 'Send Quote' : 'Update Quote'}
              </button>
            </div>
            <p className="text-xs text-gray-400">
              The customer accepts this before paying, so double-check the amount and time.
            </p>
          </div>
        )}

        {/* The single action that belongs to whoever is viewing */}
        {!isCancelled && !showQuoteForm && (
          <div className="space-y-2">
            {isProvider && status === 'QUOTED' && (
              <>
                <p className="text-sm text-gray-500">Waiting for the customer to accept your quote.</p>
                <button
                  onClick={() => setEditingQuote(true)}
                  disabled={busy}
                  className="w-full px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-orange-50 hover:border-orange-300 font-medium transition-all disabled:opacity-50"
                >
                  Revise Quote
                </button>
              </>
            )}

            {!isProvider && status === 'QUOTED' && (
              <button
                onClick={() => run(() => bookingApi.accept(conversationId))}
                disabled={busy}
                className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-4 w-4" /> Accept Quote
              </button>
            )}

            {!isProvider && status === 'ACCEPTED' && (
              <button
                onClick={() => setPayOpen(true)}
                disabled={busy}
                className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CreditCard className="h-4 w-4" /> Pay Now
              </button>
            )}

            {isProvider && status === 'ACCEPTED' && (
              <>
                <p className="text-sm text-gray-500">Waiting for the customer to pay.</p>
                <button
                  onClick={() => run(() => bookingApi.markCashPaid(conversationId))}
                  disabled={busy}
                  className="w-full px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-orange-50 hover:border-orange-300 font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Banknote className="h-4 w-4" /> I received cash instead
                </button>
              </>
            )}

            {isProvider && status === 'PAID' && (
              <button
                onClick={() => run(() => bookingApi.complete(conversationId))}
                disabled={busy}
                className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-4 w-4" /> Mark Service Complete
              </button>
            )}

            {!isProvider && status === 'PAID' && (
              <p className="text-sm text-gray-500">
                Payment received. The provider will mark this complete once the work is delivered.
              </p>
            )}

            {status === 'INQUIRY' && !isProvider && (
              <p className="text-sm text-gray-500">
                Discuss what you need in the chat. The provider will send you a price and time to accept.
              </p>
            )}

            {status === 'COMPLETED' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-emerald-700">
                  This booking is complete. You can now leave a review.
                </p>
              </div>
            )}

            {/* Cancelling stays possible until money changes hands - including
                when it's your move. This was gated on !myTurn, which hid it in
                exactly the case where it's most needed: a customer looking at a
                quote they don't want could only accept or abandon the thread. */}
            {(status === 'INQUIRY' || status === 'QUOTED' || status === 'ACCEPTED') && (
              <button
                onClick={() => run(() => bookingApi.cancel(conversationId))}
                disabled={busy}
                className="w-full px-4 py-2.5 text-sm text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                Cancel booking
              </button>
            )}
          </div>
        )}

        {isCancelled && !showQuoteForm && (
          <div className="space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">
                This booking was cancelled{booking.cancelReason ? `: ${booking.cancelReason}` : '.'}
              </p>
            </div>

            {/* A cancellation shouldn't strand the conversation - the provider
                can put a new quote on the table and pick it back up. */}
            {isProvider ? (
              <button
                onClick={() => setEditingQuote(true)}
                disabled={busy}
                className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
              >
                Send a new quote
              </button>
            ) : (
              <p className="text-sm text-gray-500">
                Message the provider if you&apos;d like them to send a new quote.
              </p>
            )}
          </div>
        )}

        {/* Refunds: the only recovery once a booking is paid, since paid
            bookings can't be cancelled. Customer-side only. */}
        {!isProvider && paymentInfo && (status === 'PAID' || status === 'COMPLETED') && (
          paymentInfo.refund ? (
            <div
              className={`rounded-xl border p-3 ${
                paymentInfo.refund.status === 'APPROVED'
                  ? 'border-emerald-200 bg-emerald-50'
                  : paymentInfo.refund.status === 'DECLINED'
                    ? 'border-red-200 bg-red-50'
                    : 'border-amber-200 bg-amber-50'
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  paymentInfo.refund.status === 'APPROVED'
                    ? 'text-emerald-700'
                    : paymentInfo.refund.status === 'DECLINED'
                      ? 'text-red-600'
                      : 'text-amber-700'
                }`}
              >
                {paymentInfo.refund.status === 'APPROVED'
                  ? 'Refund approved'
                  : paymentInfo.refund.status === 'DECLINED'
                    ? 'Refund declined'
                    : 'Refund request under review'}
              </p>
              {paymentInfo.refund.decisionNote && (
                <p className="mt-1 text-xs text-gray-600">{paymentInfo.refund.decisionNote}</p>
              )}
            </div>
          ) : (
            <button
              onClick={() => setRefundOpen(true)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            >
              Request a refund
            </button>
          )
        )}

        {/* Once money has changed hands, the two parties need to find each other. */}
        {(status === 'PAID' || status === 'COMPLETED') && directions && (
          <>
            <button
              onClick={() => setDirectionsOpen(true)}
              className="w-full px-4 py-3 bg-white text-gray-900 rounded-xl hover:bg-orange-50 hover:border-orange-300 transition-all font-medium border border-gray-200 flex items-center justify-center gap-2"
            >
              <Navigation className="h-4 w-4 text-orange-600" />
              {isProvider ? 'Directions to customer' : 'Directions to service'}
            </button>
            <p className="text-xs text-gray-400 text-center -mt-1 truncate">{directions.label}</p>
          </>
        )}

        {/* Secondary actions */}
        <div className="pt-2 space-y-2 border-t border-gray-100">
          {onViewUserDetails && (
            <button
              onClick={onViewUserDetails}
              className="w-full px-4 py-3 bg-white text-gray-900 rounded-xl hover:bg-orange-50 hover:border-orange-300 transition-all font-medium border border-gray-200 flex items-center justify-center gap-2"
            >
              <UserIcon className="h-4 w-4" />
              {isProvider ? 'View Customer' : 'View Service Provider'}
            </button>
          )}
          {onReviewClick && status === 'COMPLETED' && (
            <button
              onClick={onReviewClick}
              className="w-full px-4 py-3 bg-white text-gray-900 rounded-xl hover:bg-orange-50 hover:border-orange-300 transition-all font-medium border border-gray-200 flex items-center justify-center gap-2"
            >
              <Star className="h-4 w-4 text-amber-500" />
              {isProvider ? 'Rate Customer' : 'Rate Service & Provider'}
            </button>
          )}
        </div>
      </div>

      {directions && (
        <DirectionsModal
          isOpen={directionsOpen}
          onClose={() => setDirectionsOpen(false)}
          title={directions.label}
          latitude={directions.latitude}
          longitude={directions.longitude}
          address={directions.address}
        />
      )}

      {paymentInfo && (
        <RefundRequestModal
          isOpen={refundOpen}
          onClose={() => setRefundOpen(false)}
          onSuccess={() => loadPaymentInfo(booking.id)}
          paymentId={paymentInfo.paymentId}
          amount={Number(paymentInfo.amount)}
          currency={paymentInfo.currency}
        />
      )}

      {booking.price != null && (
        <PaymentModal
          isOpen={payOpen}
          onClose={() => setPayOpen(false)}
          serviceId={booking.serviceId}
          bookingId={booking.id}
          serviceName={booking.service.title || 'Booking'}
          servicePrice={Number(booking.price)}
          serviceCurrency={(booking.currency || 'lkr').toLowerCase()}
          serviceImage={booking.service.images?.[0]}
          onPaymentSuccess={() => {
            setPayOpen(false);
            bookingApi.getByConversation(conversationId).then(setBooking).catch(() => {});
          }}
        />
      )}
    </div>
  );
};

export default BookingPanel;
