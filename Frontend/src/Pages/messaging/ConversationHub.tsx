import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { MessagingProvider, useMessaging } from '../../components/Messaging';
import { userApi } from '../../api/userApi';
import Button from '../../components/shared/Button';
import ConversationListItem from '../../components/Messaging/ConversationListItem';
import NewConversationModal from '../../components/Messaging/NewConversationModal';
import ConversationListSkeleton from '../../components/Messaging/ConversationListSkeleton';
import EmptyConversationsState from '../../components/Messaging/EmptyConversationsState';
import ConversationHubError from '../../components/Messaging/ConversationHubError';
import ConversationHubPageSkeleton from '../../components/Messaging/ConversationHubPageSkeleton';
import ConversationDetailPane from '../../components/Messaging/ConversationDetailPane';
import PageHeader from '../../components/shared/PageHeader';
import { getBookingTimeline, type BookingTimelineEntry } from '../../api/bookingApi';
import type { UserProfile } from '../../api/userApi';
import type { ConversationWithLastMessage } from '../../api/messagingApi';

const ConversationHubContent: React.FC<{ currentUser: UserProfile }> = ({ currentUser }) => {
  return (
    <MessagingProvider userId={currentUser.id}>
      <ConversationHubInner currentUserId={currentUser.id} />
    </MessagingProvider>
  );
};

const ConversationHubInner: React.FC<{ currentUserId: string }> = ({ currentUserId }) => {
  const {
    conversations,
    loading,
    error,
    startNewConversation,
    loadConversations,
    selectConversation,
    checkUserOnlineStatus
  } = useMessaging();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  // conversationId -> booking status/unread, so each row can preview its pipeline.
  const [bookings, setBookings] = useState<Map<string, BookingTimelineEntry>>(new Map());

  useEffect(() => {
    let alive = true;
    getBookingTimeline()
      .then((entries) => {
        if (!alive) return;
        setBookings(new Map(entries.map((e) => [e.conversationId, e])));
      })
      .catch(() => alive && setBookings(new Map()));
    return () => {
      alive = false;
    };
  }, []);

  const navigate = useNavigate();
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
  const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [loadingProfiles, setLoadingProfiles] = useState<Set<string>>(new Set());

  // Fetch user profiles for conversations
  useEffect(() => {
    const fetchUserProfiles = async () => {
      const userIds = conversations
        .map(conv => conv.userIds.find(id => id !== currentUserId))
        .filter((id): id is string => id !== undefined)
        .filter(id => !userProfiles.has(id) && !loadingProfiles.has(id));

      if (userIds.length === 0) return;

      setLoadingProfiles(prev => new Set([...prev, ...userIds]));

      const profilePromises = userIds.map(async (userId) => {
        try {
          const profile = await userApi.getUserById(userId);
          return { userId, profile };
        } catch (error) {
          console.error(`Failed to fetch profile for user ${userId}:`, error);
          return {
            userId,
            profile: {
              id: userId,
              firstName: 'Unknown',
              lastName: 'User',
              email: 'unknown@example.com',
              role: 'USER',
              isActive: false,
              location: '',
              phone: '',
              createdAt: new Date().toISOString(),
              isEmailVerified: false
            }
          };
        }
      });

      const results = await Promise.all(profilePromises);

      setUserProfiles(prev => {
        const newMap = new Map(prev);
        results.forEach(({ userId, profile }) => {
          if (profile) {
            newMap.set(userId, profile);
          }
        });
        return newMap;
      });

      setLoadingProfiles(prev => {
        const newSet = new Set(prev);
        userIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    };

    fetchUserProfiles();
  }, [conversations, currentUserId, userProfiles, loadingProfiles]);

  const handleStartNewConversation = async (otherUserId: string) => {
    try {
      const conversation = await startNewConversation(otherUserId);
      setIsNewConversationModalOpen(false);
      await loadConversations();
      navigate(`/conversation/${conversation.id}`);
    } catch (error) {
      console.error('Failed to start new conversation:', error);
    }
  };

  /**
   * On a wide screen the conversation opens beside the list; on a narrow one
   * there isn't room for both, so it still takes over the page.
   */
  const handleSelectConversation = (conversation: ConversationWithLastMessage) => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      setSelectedId(conversation.id);
      selectConversation(conversation).catch((err) =>
        console.error('Failed to open conversation:', err)
      );
      return;
    }
    navigate(`/conversation/${conversation.id}`);
  };

  const getOtherParticipant = (conversation: ConversationWithLastMessage) => {
    return conversation.userIds.find(id => id !== currentUserId) || 'Unknown User';
  };

  if (error) {
    return <ConversationHubError error={error} onRetry={() => loadConversations()} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-50 to-white text-gray-900">
      <main className="container mx-auto mt-16 flex-grow px-4 py-8">
        <div className="mx-auto max-w-4xl lg:max-w-7xl">
          {/* Header */}
          <PageHeader
            title="Conversation Hub"
            subtitle="Connect, communicate, and collaborate with your network in a seamless messaging experience"
          />

          {/* Actions */}
          <div className="mb-8 flex justify-center">
            <Button onClick={() => setIsNewConversationModalOpen(true)} size="lg" className="shadow-orange-500/30">
              <Plus className="mr-2 h-4 w-4" />
              Start New Conversation
            </Button>
          </div>

          {/* New Conversation Modal */}
          {isNewConversationModalOpen && (
            <NewConversationModal
              onClose={() => setIsNewConversationModalOpen(false)}
              onSelectUser={handleStartNewConversation}
            />
          )}

          {/* Master-detail: the list keeps its own column and the selected
              conversation opens beside it, so reading a thread no longer means
              losing sight of the rest. Single column below lg. */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:max-h-[calc(100vh-16rem)] lg:overflow-y-auto">
            <div>
              {loading && conversations.length === 0 ? (
                <ConversationListSkeleton />
              ) : conversations.length === 0 ? (
                <EmptyConversationsState onStartConversation={() => setIsNewConversationModalOpen(true)} />
              ) : (
                <div className="divide-y divide-gray-100">
                  {conversations.map((conversation) => {
                    const otherParticipantId = getOtherParticipant(conversation);
                    return (
                      <ConversationListItem
                        key={conversation.id}
                        conversation={conversation}
                        currentUserId={currentUserId}
                        otherParticipantId={otherParticipantId}
                        userProfile={userProfiles.get(otherParticipantId)}
                        isLoadingProfile={loadingProfiles.has(otherParticipantId)}
                        isOnline={checkUserOnlineStatus(otherParticipantId)}
                        onSelect={handleSelectConversation}
                        bookingStatus={bookings.get(conversation.id)?.status}
                        bookingUnread={bookings.get(conversation.id)?.unreadCount}
                        isSelected={selectedId === conversation.id}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Detail pane - wide screens only; narrow ones navigate instead. */}
          <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:block lg:h-[calc(100vh-16rem)]">
            <ConversationDetailPane
              conversationId={selectedId}
              currentUserId={currentUserId}
            />
          </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const ConversationHub: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await userApi.getProfile();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // Redirect straight to login if the user isn't authenticated
  useEffect(() => {
    if (!loading && (error || !currentUser)) {
      localStorage.setItem('RedirectAfterLogin', window.location.pathname);
      navigate('/signin', { replace: true });
    }
  }, [loading, error, currentUser, navigate]);

  if (loading || error || !currentUser) {
    return <ConversationHubPageSkeleton />;
  }

  return <ConversationHubContent currentUser={currentUser} />;
};

export default ConversationHub;
