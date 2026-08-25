import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessagingProvider, MessageThread, useMessaging } from '../../components/Messaging';
import { userApi } from '../../api/userApi';
import { serviceApi } from '../../api/serviceApi';
import type { UserProfile } from '../../api/userApi';
import ConfirmationPanel from '../../components/Messaging/ConfirmationPanel';
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
  const [isChatVisibleOnMobile, setIsChatVisibleOnMobile] = useState(true); // Default to showing chat on mobile

  // Auto-select conversation based on URL parameter
  useEffect(() => {
    const handleConversationSelection = async () => {
      if (!conversationId) {
        setConversationError('No conversation ID provided');
        setIsConversationLoading(false);
        return;
      }

      // If we already have the right conversation active, we're done
      if (activeConversation?.id === conversationId) {
        setIsConversationLoading(false);
        return;
      }

      // Try to find the conversation in our current list
      if (conversations.length > 0) {
        const targetConversation = conversations.find((conv: any) => conv.id === conversationId);
        if (targetConversation) {
          console.log('Selecting conversation from existing list:', conversationId);
          try {
            await selectConversation(targetConversation);
            setIsConversationLoading(false);
          } catch (error) {
            console.error('Failed to select conversation:', error);
            setConversationError('Failed to load conversation');
            setIsConversationLoading(false);
          }
        } else {
          // Conversation not found, try to refresh
          console.warn('Conversation not found in list, refreshing conversations');
          try {
            await loadConversations();
          } catch (error) {
            console.error('Failed to refresh conversations:', error);
            setConversationError('Conversation not found');
            setIsConversationLoading(false);
          }
        }
      }
    };

    handleConversationSelection();
  }, [conversationId, activeConversation, conversations, selectConversation, loadConversations]);

  // Handle conversation selection after conversations are loaded
  useEffect(() => {
    if (conversationId && conversations.length > 0 && !activeConversation && isConversationLoading) {
      const targetConversation = conversations.find((conv: any) => conv.id === conversationId);
      if (targetConversation) {
        console.log('Selecting conversation after conversations update:', conversationId);
        selectConversation(targetConversation).then(() => {
          setIsConversationLoading(false);
        }).catch((error) => {
          console.error('Failed to select conversation after update:', error);
          setConversationError('Failed to load conversation');
          setIsConversationLoading(false);
        });
      } else if (!loading) {
        setConversationError('Conversation not found');
        setIsConversationLoading(false);
      }
    }
  }, [conversations, conversationId, activeConversation, isConversationLoading, loading]);

  const handleBackToHub = () => {
    navigate('/conversation-hub');
  };

  const handleReviewClick = async () => {
    if (!activeConversation) return;
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      // Add cache-busting param to always get fresh data
      const res = await fetch(`/api/confirmations/${activeConversation.id}?t=${Date.now()}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to fetch confirmation status');
      const data = await res.json();
      if (data.customerConfirmation && data.providerConfirmation) {
        if (currentUserRole === 'USER') {
          // Get the service from the conversation for rating
          try {
            const serviceResponse = await serviceApi.getServiceByConversationId(activeConversation.id);
            if (serviceResponse.success && serviceResponse.data) {
              setServiceData(serviceResponse.data);
              setRatingType('service');
              setIsRatingModalOpen(true);
            } else {
              setConversationError('Service information not found for this conversation.');
            }
          } catch (serviceError) {
            console.error('Failed to get service from conversation:', serviceError);
            setConversationError('Failed to get service information. Please try again.');
          }
        } else if (currentUserRole === 'PROVIDER') {
          // Rate customer - modal will handle finding customer ID
          setRatingType('customer');
          setIsRatingModalOpen(true);
        }
      } else {
        setConversationError('Both customer and provider must confirm the booking before rating.');
      }
    } catch {
      setConversationError('Failed to check confirmation status. Please try again.');
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
                  <ConfirmationPanel
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
