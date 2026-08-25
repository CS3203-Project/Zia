import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, XCircle, ImageOff, ArrowRight } from 'lucide-react';
import {
  BOOKING_STEPS,
  STATUS_META,
  type BookingTimelineEntry,
  type BookingStatus,
} from '../../api/bookingApi';

const toneClasses: Record<string, string> = {
  neutral: 'bg-gray-100 text-gray-600 border-gray-200',
  active: 'bg-orange-50 text-orange-700 border-orange-200',
  done: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  error: 'bg-red-50 text-red-600 border-red-200',
};

const relative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

/** Compact pipeline: which stage this booking has reached. */
const Pipeline: React.FC<{ status: BookingStatus }> = ({ status }) => {
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-600">
        <XCircle className="h-3.5 w-3.5" /> Cancelled
      </div>
    );
  }

  const idx = BOOKING_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1" aria-label={`Stage: ${STATUS_META[status].label}`}>
      {BOOKING_STEPS.map((step, i) => (
        <React.Fragment key={step}>
          <span
            title={STATUS_META[step].label}
            className={`h-1.5 w-6 rounded-full transition-colors ${
              i <= idx ? 'bg-orange-500' : 'bg-gray-200'
            }`}
          />
        </React.Fragment>
      ))}
      <span className="ml-2 text-xs font-medium text-gray-600">{STATUS_META[status].label}</span>
    </div>
  );
};

/**
 * Booking activity as a per-booking timeline: the pipeline it's reached, plus each
 * action in order. Replaces the previous notifications list, which rendered raw
 * email HTML and in practice showed nothing at all.
 */
const BookingTimeline: React.FC<{ entries: BookingTimelineEntry[] }> = ({ entries }) => {
  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 mx-auto mb-4">
          <Clock className="h-8 w-8 text-orange-300" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No booking activity yet</h3>
        <p className="text-gray-500">
          Once you book a service — or receive a booking — its progress appears here.
        </p>
      </div>
    );
  }

  // Bookings waiting on this user float to the top; the rest stay newest-first.
  const ordered = [...entries].sort((a, b) => {
    const turn = (e: BookingTimelineEntry) =>
      ({ INQUIRY: 'PROVIDER', QUOTED: 'CUSTOMER', ACCEPTED: 'CUSTOMER', PAID: 'PROVIDER' } as Record<string, string>)[
        e.status
      ] === e.role;
    if (turn(a) !== turn(b)) return turn(a) ? -1 : 1;
    return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
  });

  return (
    <div className="space-y-4">
      {ordered.map((entry) => {
        const meta = STATUS_META[entry.status];

        // Whose move it is at each stage — mirrors the server-side transition
        // rules, so the badge can't tell you to act when the API would refuse.
        const owner: Partial<Record<BookingStatus, 'CUSTOMER' | 'PROVIDER'>> = {
          INQUIRY: 'PROVIDER',
          QUOTED: 'CUSTOMER',
          ACCEPTED: 'CUSTOMER',
          PAID: 'PROVIDER',
        };
        const myTurn = owner[entry.status] === entry.role;

        return (
          <div
            key={entry.bookingId}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            {/* Booking header */}
            <div className="flex items-start gap-4 p-5 border-b border-gray-100">
              <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">
                {entry.service.images?.[0] ? (
                  <img
                    src={entry.service.images[0]}
                    alt={entry.service.title || 'Service'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageOff className="h-5 w-5 text-gray-300" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {entry.service.title || 'Service booking'}
                  </h3>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {myTurn && (
                      <span className="rounded-full bg-orange-600 px-2.5 py-1 text-xs font-semibold text-white">
                        Your turn
                      </span>
                    )}
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border ${toneClasses[meta.tone]}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {entry.role === 'PROVIDER' ? 'You are the provider' : 'You are the customer'}
                  {entry.price != null && ` · ${entry.currency} ${Number(entry.price).toFixed(2)}`}
                </p>
                <div className="mt-3">
                  <Pipeline status={entry.status} />
                </div>
              </div>
            </div>

            {/* Event timeline. Each action links into the booking panel, so tapping
                "Quote sent" takes you to the quote you need to act on. */}
            <ol className="p-5 space-y-0">
              {entry.events.map((ev, i) => {
                const isLast = i === entry.events.length - 1;
                return (
                  <li key={ev.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                          isLast ? 'bg-orange-500 ring-4 ring-orange-100' : 'bg-gray-300'
                        }`}
                      />
                      {!isLast && <span className="w-px flex-1 bg-gray-200 my-1" />}
                    </div>
                    <Link
                      to={`/conversation/${entry.conversationId}?view=booking`}
                      className={`group flex-1 -my-0.5 rounded-lg px-2 py-1 transition-colors hover:bg-orange-50 ${
                        isLast ? 'mb-0' : 'mb-3'
                      }`}
                    >
                      <p className="text-sm text-gray-900 group-hover:text-orange-800">
                        {ev.message}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400">
                        {ev.byMe ? (
                          <span>You · {relative(ev.createdAt)}</span>
                        ) : (
                          <>
                            <span className="rounded-full bg-orange-100 px-1.5 py-0.5 font-medium text-orange-700">
                              They
                            </span>
                            <span>{relative(ev.createdAt)}</span>
                          </>
                        )}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ol>

            <Link
              to={`/conversation/${entry.conversationId}?view=booking`}
              className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-100 text-sm font-medium text-orange-700 hover:bg-orange-50 transition-colors"
            >
              Open booking
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export { Pipeline };
export default BookingTimeline;
