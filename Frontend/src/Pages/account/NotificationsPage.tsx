import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, Check, CheckCheck, Clock, AlertCircle, ShoppingCart, MessageSquare,
  CalendarCheck, ArrowRight,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { cn } from '../../utils/utils';
import Button from '../../components/shared/Button';
import { getBookingTimeline } from '../../api/bookingApi';

const NotificationsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [bookingCount, setBookingCount] = useState(0);
  const {
    notifications,
    stats,
    loading,
    error,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  useEffect(() => {
    let alive = true;
    getBookingTimeline()
      .then((data) => alive && setBookingCount(data.length))
      .catch(() => alive && setBookingCount(0));
    return () => {
      alive = false;
    };
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  const getNotificationIcon = (emailType: string) => {
    switch (emailType) {
      case 'BOOKING_CONFIRMATION':
        return <ShoppingCart className="h-5 w-5 text-orange-600" />;
      case 'BOOKING_REMINDER':
        return <Clock className="h-5 w-5 text-orange-600" />;
      case 'BOOKING_CANCELLATION_MODIFICATION':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'NEW_MESSAGE_OR_REVIEW':
        return <MessageSquare className="h-5 w-5 text-orange-600" />;
      default:
        return <Bell className="h-5 w-5 text-orange-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-4">
            {/* Skeleton Header */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 animate-pulse">
              <div className="h-8 bg-gray-100 rounded-full w-1/4 mb-4" />
              <div className="h-4 bg-gray-100 rounded-full w-1/2" />
            </div>

            {/* Skeleton Notifications */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
                <div className="h-6 bg-gray-100 rounded-full w-3/4 mb-3" />
                <div className="h-4 bg-gray-100 rounded-full w-full mb-2" />
                <div className="h-4 bg-gray-100 rounded-full w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100">
                <Bell className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Notifications
                </h1>
                <p className="mt-1 text-gray-500">
                  Stay updated with your service bookings and messages
                </p>
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </div>
                  <div className="text-sm text-gray-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.unread}
                  </div>
                  <div className="text-sm text-gray-500">Unread</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.read}
                  </div>
                  <div className="text-sm text-gray-500">Read</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Booking progress lives on its own page — link across rather than
            duplicating the timeline here. */}
        {bookingCount > 0 && (
          <Link
            to="/bookings"
            className="mb-6 flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50 px-5 py-4 transition-colors hover:bg-orange-100"
          >
            <span className="flex items-center gap-3 text-sm font-medium text-orange-800">
              <CalendarCheck className="h-4 w-4 flex-shrink-0" />
              You have {bookingCount} booking{bookingCount === 1 ? '' : 's'} in progress
            </span>
            <ArrowRight className="h-4 w-4 flex-shrink-0 text-orange-600" />
          </Link>
        )}

        {/* Filters and Actions */}
        {(
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'unread', label: 'Unread' },
                { key: 'read', label: 'Read' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as 'all' | 'unread' | 'read')}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200',
                    filter === key
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300 hover:text-orange-700'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {stats && stats.unread > 0 && (
              <Button onClick={handleMarkAllAsRead} className="px-6">
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark All as Read
              </Button>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 mx-auto mb-4">
                <Bell className="h-8 w-8 text-orange-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p className="text-gray-500">
                {filter === 'unread'
                  ? 'You have read all your notifications!'
                  : 'When you receive notifications, they will appear here.'
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'relative bg-white rounded-2xl border transition-all duration-200 hover:shadow-md overflow-hidden',
                  notification.isRead
                    ? 'border-gray-100 shadow-sm'
                    : 'border-orange-200 shadow-sm'
                )}
              >
                {!notification.isRead && (
                  <span className="absolute left-0 top-0 h-full w-1 bg-orange-500" />
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 relative">
                        {getNotificationIcon(notification.emailType)}
                        {!notification.isRead && (
                          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-rose-500 ring-2 ring-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4">
                          <h3
                            className={cn(
                              'text-lg truncate',
                              notification.isRead
                                ? 'font-semibold text-gray-700'
                                : 'font-bold text-gray-900'
                            )}
                          >
                            {notification.subject}
                          </h3>
                          <span className="text-sm text-gray-400 whitespace-nowrap flex-shrink-0">
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>

                        <div
                          className="mt-2 text-sm prose prose-sm max-w-none text-gray-500"
                          dangerouslySetInnerHTML={{ __html: notification.html }}
                        />

                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="mt-3 inline-flex items-center text-sm text-orange-600 hover:text-orange-700 transition-colors font-semibold"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
