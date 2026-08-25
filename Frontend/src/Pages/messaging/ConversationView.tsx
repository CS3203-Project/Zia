import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MessagingProvider, MessageThread, useMessaging } from '../../components/Messaging';
import { userApi } from '../../api/userApi';
import { serviceApi } from '../../api/serviceApi';
import { bookingApi } from '../../api/bookingApi';
import { messagingApi, type ConversationWithLastMessage } from '../../api/messagingApi';
import type { UserProfile } from '../../api/userApi';
import BookingPanel from '../../components/Messaging/BookingPanel';
import RatingModal from '../../components/Messaging/RatingModal';
import UserDetailsModal from '../../components/Messaging/UserDetailsModal';
import ConversationThreadHeader from '../../components/Messaging/ConversationThreadHeader';
import MobileViewToggle from '../../components/Messaging/MobileViewToggle';
import ConversationLoadingSkeleton from '../../components/Messaging/ConversationLoadingSkeleton';
import ConversationNotFound from '../../components/Messaging/ConversationNotFound';
import ConversationErrorState from '../../components/Messaging/ConversationErrorState';
import ConversationPageSkeleton from '../../components/Messaging/ConversationPageSkeleton';

const ConversationViewContent: React.FC<{ currentUser: UserProfile; conversationId: string }> = ({ currentUser, conversationId }) => {
  const [currentUserRole, setCurrentUserRole] = useState<'USER' | 'PROVIDER'>('USER');

  useEffect(() => {
    const fetchServiceProvider = async () => {
      try {
        const serviceRes = await serviceApi.getServiceByConversationId(conversationId);

        if (serviceRes.success && serviceRes.data && serviceRes.data.provider) {
          const provider = serviceRes.data.provider as any;
          const providerUserId = provider.userId;
          const isProvider = currentUser.id === providerUserId;
          const role = isProvider ? 'PROVIDER' : 'USER';
          setCurrentUserRole(role);
        }
      } catch (err) {
        console.error('Failed to fetch service provider:', err);
      }
    };
    fetchServiceProvider();
  }, [conversationId, currentUser.id]);

  return (
    <MessagingProvider userId={currentUser.id}>
      <ConversationViewInner
        conversationId={conversationId}
        currentUserRole={currentUserRole}
        currentUserId={currentUser.id}
      />
    </MessagingProvider>
  );
};

const ConversationViewInner: React.FC<{
  conversationId: string;
  currentUserRole: 'USER'|'PROVIDER'|string;
  currentUserId: string;
}> = ({ conversationId, currentUserRole, currentUserId }) => {
  const {
    conversations,
    activeConversation,
    selectConversation,
    loadConversations,
    loading
  } = useMessaging();
  const navigate = useNavigate();
  const [isConversationLoading, setIsConversationLoading] = useState(true);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingType, setRatingType] = useState<'customer' | 'service'>('customer');
  const [serviceData, setServiceData] = useState<any>(null);
  const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState(false);
  // `?view=booking` opens straight onto the booking panel — used by notification
  // links, so tapping "Quote sent" lands on the quote rather than the chat tab.
  const [searchParams] = useSearchParams();
  const [isChatVisibleOnMobile, setIsChatVisibleOnMobile] = useState(
    searchParams.get('view') !== 'booking'
  );

  // Resolve the conversation named in the URL, exactly once per id.
  //
  // This previously ran off the cached conversation list and, when the id wasn't
  // in it, called loadConversations() from an effect that also *depended* on that
  // list - so a conversation missing from the cache re-triggered the effect
  // forever, hammering the API (~44 req/s) until the rate limiter returned 429.
  // A freshly created conversation is never in the cache, which is exactly the
  // case hit when re-booking a service after completing it: the user landed on
  // "Conversation not found" while the tab quietly spammed the backend.
  //
  // Fetching the conversation by id is authoritative, needs one request, and
  // can't loop.
  const resolveAttemptedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setConversationError('No conversation ID provided');
      setIsConversationLoading(false);
      return;
    }

    if (activeConversation?.id === conversationId) {
      setIsConversationLoading(false);
      return;
    }

    if (resolveAttemptedFor.current === conversationId) return;
    resolveAttemptedFor.current = conversationId;

    let alive = true;
    setIsConversationLoading(true);
    setConversationError(null);

    (async () => {
      try {
        const cached = conversations.find(
          (conv: ConversationWithLastMessage) => conv.id === conversationId
        );
        const conversation = cached ?? (await messagingApi.getConversationById(conversationId));

        if (!alive) return;
        await selectConversation(conversation);

        // Keep the hub list in step, but never gate this view on it.
        if (!cached) loadConversations().catch(() => {});
      } catch (error) {
        console.error('Failed to load conversation:', error);
        if (alive) setConversationError('Conversation not found');
      } finally {
        if (alive) setIsConversationLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // Intentionally not depending on `conversations`: it changes as the list
    // loads, and re-running on it is what caused the loop above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, activeConversation?.id]);

  const handleBackToHub = () => {
    navigate('/conversation-hub');
  };

  // Reviews unlock once the provider marks the booking COMPLETED. The panel only
  // renders the rate button in that state, but re-check here so a stale view
  // can't open the modal against a booking that isn't finished.
  const handleReviewClick = async () => {
    if (!activeConversation) return;
    try {
      const booking = await bookingApi.getByConversation(activeConversation.id);

      if (booking.status !== 'COMPLETED') {
        setConversationError('You can leave a review once the provider marks the service complete.');
        return;
      }

      if (currentUserRole === 'PROVIDER') {
        setRatingType('customer');
        setIsRatingModalOpen(true);
        return;
      }

      setServiceData(booking.service);
      setRatingType('service');
      setIsRatingModalOpen(true);
    } catch {
      setConversationError('Failed to check the booking status. Please try again.');
    }
  };

  const handleCloseRatingModal = () => {
    setIsRatingModalOpen(false);
    setServiceData(null);
  };

  const handleViewUserDetails = () => {
    setIsUserDetailsModalOpen(true);
  };

  const handleCloseUserDetailsModal = () => {
    setIsUserDetailsModalOpen(false);
  };

  if (conversationError) {
    return <ConversationErrorState error={conversationError} onBackToHub={handleBackToHub} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <main className="flex-grow px-4 py-6 mt-16">
        {/* On mobile, the Confirmation tab needs to flow naturally with the page
            (it's a form, not a pinned chat log), while the Chat tab needs a fixed
            viewport height so its message list scrolls internally and the composer
            stays pinned at the bottom. Only constrain the height when Chat is the
            visible mobile tab; desktop always keeps the fixed two-pane height. */}
        <div className={`flex flex-col ${!isChatVisibleOnMobile ? 'md:h-[calc(100vh-8rem)]' : 'h-[calc(100vh-8rem)]'}`}>
          <ConversationThreadHeader title={activeConversation?.title} onBack={handleBackToHub} />

          {/* Main Content */}
          <div className={`bg-white rounded-2xl shadow-xl flex-1 flex flex-col md:flex-row border border-gray-100 relative ${
            !isChatVisibleOnMobile ? 'overflow-visible md:overflow-hidden' : 'overflow-hidden'
          }`}>
            {isConversationLoading || loading ? (
              <ConversationLoadingSkeleton
                isChatVisibleOnMobile={isChatVisibleOnMobile}
                onToggleMobileView={setIsChatVisibleOnMobile}
              />
            ) : activeConversation ? (
              <>
                <MobileViewToggle
                  isChatVisibleOnMobile={isChatVisibleOnMobile}
                  onToggle={setIsChatVisibleOnMobile}
                  variant="active"
                />

                {/* Left Side - Confirmation Panel */}
                <div className={`w-full md:w-80 xl:w-96 flex-shrink-0 flex flex-col bg-gray-50 backdrop-blur-sm border-b md:border-b-0 md:border-r border-gray-200 md:overflow-y-auto md:h-full ${
                  isChatVisibleOnMobile ? 'hidden md:flex' : 'flex'
                }`}>
                  <BookingPanel
                    key={activeConversation.id}
                    conversationId={activeConversation.id}
                    currentUserRole={currentUserRole as 'USER' | 'PROVIDER'}
                    onReviewClick={handleReviewClick}
                    onViewUserDetails={handleViewUserDetails}
                  />
                </div>

                {/* Right Side - Message Thread */}
                <div className={`flex-1 min-w-0 flex flex-col overflow-hidden relative z-10 ${
                  !isChatVisibleOnMobile ? 'hidden md:flex' : 'flex'
                }`}>
                  <MessageThread />
                </div>
              </>
            ) : (
              <ConversationNotFound onBackToHub={handleBackToHub} />
            )}
          </div>
        </div>
      </main>

      {/* Rating Modal */}
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={handleCloseRatingModal}
        ratingType={ratingType}
        conversation={activeConversation || undefined}
        conversationId={conversationId}
        currentUserId={currentUserId}
        serviceData={serviceData}
      />

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={isUserDetailsModalOpen}
        onClose={handleCloseUserDetailsModal}
        userRole={currentUserRole as 'USER' | 'PROVIDER'}
        conversationId={conversationId}
        currentUserId={currentUserId}
      />
    </div>
  );
};

const ConversationView: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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

  // Redirect if no conversation ID
  useEffect(() => {
    if (!conversationId) {
      navigate('/conversation-hub');
    }
  }, [conversationId, navigate]);

  // Redirect straight to login if the user isn't authenticated
  useEffect(() => {
    if (!loading && (error || !currentUser)) {
      localStorage.setItem('RedirectAfterLogin', window.location.pathname);
      navigate('/signin', { replace: true });
    }
  }, [loading, error, currentUser, navigate]);

  if (loading || error || !currentUser) {
    return <ConversationPageSkeleton />;
  }

  if (!conversationId) {
    return null; // Will be redirected by useEffect
  }

  return <ConversationViewContent currentUser={currentUser} conversationId={conversationId} />;
};

export default ConversationView;
