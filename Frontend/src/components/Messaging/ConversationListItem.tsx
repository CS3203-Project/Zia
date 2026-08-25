import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { UserProfile } from '../../api/userApi';
import type { ConversationWithLastMessage } from '../../api/messagingApi';
import { STATUS_META, type BookingStatus } from '../../api/bookingApi';

const STATUS_TONE: Record<string, string> = {
  neutral: 'bg-gray-100 text-gray-600 border-gray-200',
  active: 'bg-orange-50 text-orange-700 border-orange-200',
  done: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  error: 'bg-red-50 text-red-600 border-red-200',
};

interface ConversationListItemProps {
  conversation: ConversationWithLastMessage;
  currentUserId: string;
  otherParticipantId: string;
  userProfile?: UserProfile;
  isLoadingProfile: boolean;
  isOnline: boolean;
  onSelect: (conversation: ConversationWithLastMessage) => void;
  /** Where this conversation's booking has got to, previewed in the row. */
  bookingStatus?: BookingStatus;
  /** Unread booking actions by the other party. */
  bookingUnread?: number;
  /** Highlights the row when its conversation is open in the detail pane. */
  isSelected?: boolean;
}

const getContactDisplayName = (otherParticipantId: string, userProfile?: UserProfile) => {
  if (userProfile) {
    return `${userProfile.firstName} ${userProfile.lastName}`.trim();
  }

  return `User ${otherParticipantId.slice(-8)}`;
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

/**
 * A single row in the conversation list: avatar (with online indicator),
 * contact name, last message preview, timestamp and unread badge.
 */
const ConversationListItem: React.FC<ConversationListItemProps> = ({
  conversation,
  currentUserId,
  otherParticipantId,
  userProfile,
  isLoadingProfile,
  isOnline,
  onSelect,
  bookingStatus,
  bookingUnread = 0,
  isSelected = false
}) => {
  const contactDisplayName = getContactDisplayName(otherParticipantId, userProfile);
  const statusMeta = bookingStatus ? STATUS_META[bookingStatus] : null;

  return (
    <div
      onClick={() => onSelect(conversation)}
      className={`p-4 cursor-pointer transition-all duration-300 group relative overflow-hidden border-l-4 ${
        isSelected
          ? 'bg-orange-50 border-orange-500'
          : 'border-transparent hover:bg-orange-50/60 hover:border-orange-400'
      }`}
    >
      <div className="relative z-10 flex items-center gap-3">
        {/* Avatar with enhanced styling */}
        <div className="flex-shrink-0 relative">
          <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-base shadow-md ring-2 ring-white group-hover:shadow-lg transition-all duration-300">
            {contactDisplayName.charAt(0).toUpperCase()}
          </div>
          {/* Enhanced online status indicator */}
          {isOnline && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full shadow-lg animate-pulse">
              <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping"></div>
            </div>
          )}
        </div>

        {/* Content with enhanced typography */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              {/* Contact Name */}
              <div className="flex items-center space-x-2">
                <p className="truncate text-base font-bold text-gray-900">
                  {contactDisplayName}
                </p>
                {isLoadingProfile && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                )}
              </div>

              {/* Where the booking has got to, so the list doubles as a
                  pipeline overview rather than just a message log. */}
              {statusMeta && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_TONE[statusMeta.tone]}`}
                  >
                    {statusMeta.label}
                  </span>
                  {bookingUnread > 0 && (
                    <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {bookingUnread} new
                    </span>
                  )}
                </div>
              )}

              {/* Conversation Title */}
              {conversation.title &&
               !conversation.title.includes('Chat with') &&
               conversation.title !== contactDisplayName && (
                <p className="text-sm text-gray-700 truncate mt-1 font-medium">
                  {conversation.title}
                </p>
              )}

              {/* Last Message */}
              {conversation.lastMessage && (
                <p className="text-sm text-gray-500 truncate mt-2 leading-relaxed">
                  {conversation.lastMessage.fromId === currentUserId ? (
                    <span className="text-gray-900 font-medium">You: </span>
                  ) : ''}
                  {conversation.lastMessage.content}
                </p>
              )}

              {!conversation.lastMessage && (
                <p className="text-sm text-gray-400 italic mt-2">No messages yet - start the conversation!</p>
              )}
            </div>

            {/* Time and Unread */}
            <div className="ml-3 flex flex-shrink-0 flex-col items-end space-y-2">
              {conversation.lastMessage && (
                <p className="whitespace-nowrap text-xs font-medium text-gray-400">
                  {formatTime(conversation.lastMessage.createdAt)}
                </p>
              )}

              {/* `count && ...` renders a literal 0 when the count is zero, which
                  is why every row showed a stray "0" under its timestamp. */}
              {(conversation.unreadCount ?? 0) > 0 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow-md">
                  {conversation.unreadCount! > 99 ? '99+' : conversation.unreadCount}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chevron: only meaningful on narrow screens, where tapping navigates
            to the conversation. Beside the detail pane it's just noise eating
            width the contact name needs. */}
        <div className="flex-shrink-0 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 transition-all duration-300 group-hover:bg-orange-100">
            <ChevronRight className="h-4 w-4 text-gray-500 transition-colors duration-300 group-hover:text-orange-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationListItem;
