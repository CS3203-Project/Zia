import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, CheckCheck } from 'lucide-react';
import BookingTimeline from '../../components/Messaging/BookingTimeline';
import Button from '../../components/shared/Button';
import {
  getBookingTimeline,
  markBookingEventsRead,
  type BookingTimelineEntry,
} from '../../api/bookingApi';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Every booking the user is part of, as a pipeline timeline. Lives on its own
 * route (rather than as a tab under Notifications) because it's a working view -
 * it's where you go to see what's waiting on you and jump straight to it.
 */
const BookingActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [entries, setEntries] = useState<BookingTimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      localStorage.setItem('RedirectAfterLogin', window.location.pathname);
      navigate('/signin', { replace: true });
    }
  }, [authLoading, isLoggedIn, navigate]);

  useEffect(() => {
    if (!isLoggedIn) return;
    let alive = true;
    getBookingTimeline()
      .then((data) => alive && setEntries(data))
      .catch(() => alive && setEntries([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [isLoggedIn]);

  const unreadTotal = entries.reduce((sum, e) => sum + (e.unreadCount ?? 0), 0);
  // Finished bookings still belong in the timeline, but they aren't "in progress".
  const inProgress = entries.filter(
    (e) => e.status !== 'COMPLETED' && e.status !== 'CANCELLED'
  ).length;

  // Clear the badge for actions the other party took, and reflect it locally so
  // the "New" markers disappear without a refetch.
  const handleMarkAllRead = async () => {
    try {
      await markBookingEventsRead();
      setEntries((prev) =>
        prev.map((entry) => ({
          ...entry,
          unreadCount: 0,
          events: entry.events.map((ev) => ({ ...ev, unread: false })),
        }))
      );
    } catch {
      // Non-blocking: the badge simply stays until the next load.
    }
  };

  const awaitingYou = entries.filter((e) => {
    const owner: Record<string, string> = {
      INQUIRY: 'PROVIDER', QUOTED: 'CUSTOMER', ACCEPTED: 'CUSTOMER', PAID: 'PROVIDER',
    };
    return owner[e.status] === e.role;
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100">
                <CalendarCheck className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Booking Activity</h1>
                <p className="mt-1 text-gray-500">
                  Track every booking&apos;s progress and pick up where you left off
                </p>
              </div>
            </div>

            {!loading && entries.length > 0 && (
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{inProgress}</div>
                  <div className="text-sm text-gray-500">In progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{awaitingYou}</div>
                  <div className="text-sm text-gray-500">Need you</div>
                </div>
                {unreadTotal > 0 && (
                  <Button onClick={handleMarkAllRead} variant="outline" className="whitespace-nowrap">
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Mark all as read
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                <div className="h-5 bg-gray-100 rounded-full w-1/3 mb-4" />
                <div className="h-3 bg-gray-100 rounded-full w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded-full w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <BookingTimeline entries={entries} />
        )}
      </div>
    </div>
  );
};

export default BookingActivityPage;
