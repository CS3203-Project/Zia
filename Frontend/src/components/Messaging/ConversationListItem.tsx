import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { UserProfile } from '../../api/userApi';
import type { ConversationWithLastMessage } from '../../api/messagingApi';

interface ConversationListItemProps {
  conversation: ConversationWithLastMessage;
  currentUserId: string;
  otherParticipantId: string;
  userProfile?: UserProfile;
  isLoadingProfile: boolean;
  isOnline: boolean;
  onSelect: (conversation: ConversationWithLastMessage) => void;
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
  onSelect
}) => {
  const contactDisplayName = getContactDisplayName(otherParticipantId, userProfile);

  return (
    <div
      onClick={() => onSelect(conversation)}
      className="p-6 hover:bg-orange-50/60 cursor-pointer transition-all duration-300 group relative overflow-hidden border-l-4 border-transparent hover:border-orange-400"
    >
      <div className="flex items-center space-x-4 relative z-10">
        {/* Avatar with enhanced styling */}
        <div className="flex-shrink-0 relative">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md ring-2 ring-white group-hover:shadow-lg transition-all duration-300">
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
                <p className="text-xl font-bold text-gray-900 truncate">
                  {contactDisplayName}
                </p>
                {isLoadingProfile && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                )}
              </div>

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

            {/* Time and Unread with enhanced styling */}
            <div className="flex flex-col items-end ml-4 space-y-2">
              {conversation.lastMessage && (
                <p className="text-xs text-gray-400 font-medium">
                  {formatTime(conversation.lastMessage.createdAt)}
                </p>
              )}

              {conversation.unreadCount && conversation.unreadCount > 0 && (
                <div className="bg-orange-500 text-white text-xs rounded-full h-7 w-7 flex items-center justify-center font-bold shadow-md">
                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Arrow */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-all duration-300 group-hover:scale-110">
            <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-orange-600 transition-colors duration-300" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationListItem;
