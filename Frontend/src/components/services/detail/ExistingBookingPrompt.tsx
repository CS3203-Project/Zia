import React from 'react';
import { X, MessageSquare, Plus, CalendarClock } from 'lucide-react';
import { STATUS_META, type Booking } from '../../../api/bookingApi';

interface ExistingBookingPromptProps {
  isOpen: boolean;
  booking: Booking | null;
  onClose: () => void;
  onContinue: () => void;
  onStartNew: () => void;
  starting?: boolean;
}

const money = (amount: string | number | null, currency: string) =>
  amount == null ? null : `${currency} ${Number(amount).toFixed(2)}`;

/**
 * Asks what to do when the customer already has an open booking for this service.
 *
 * Previously "Book Now" silently reopened the existing conversation, which is
 * wrong when someone genuinely wants to book the same service a second time
 * (a second cleaning, another lesson) — and confusing when they'd forgotten the
 * first was still open. Both are legitimate, so let them choose.
 */
const ExistingBookingPrompt: React.FC<ExistingBookingPromptProps> = ({
  isOpen, booking, onClose, onContinue, onStartNew, starting = false,
}) => {
  if (!isOpen || !booking) return null;

  const meta = STATUS_META[booking.status];
  const price = money(booking.price, booking.currency);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24 sm:items-center sm:pt-4">
      <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative my-auto w-full max-w-md overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">You already have a booking</h2>
            <p className="mt-1 text-sm text-gray-500">
              for {booking.service.title || 'this service'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* What's already in flight, so the choice is informed */}
          <div className="mb-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Current status
              </span>
              <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                {meta.label}
              </span>
            </div>
            {price && (
              <p className="mt-3 text-lg font-bold text-gray-900">{price}</p>
            )}
            {booking.scheduledStart && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                <CalendarClock className="h-3.5 w-3.5" />
                {new Date(booking.scheduledStart).toLocaleString()}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={onContinue}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 font-medium text-white transition-colors hover:bg-orange-700"
            >
              <MessageSquare className="h-4 w-4" />
              Continue this booking
            </button>

            <button
              onClick={onStartNew}
              disabled={starting}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 font-medium text-gray-700 transition-colors hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {starting ? 'Starting…' : 'Book this service again'}
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            Booking again creates a separate request — your existing one stays open.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExistingBookingPrompt;
