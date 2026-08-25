import React, { useEffect, useState } from 'react';
import { MessageSquare, ClipboardList, Loader2, MessagesSquare } from 'lucide-react';
import { MessageThread } from './MessageThread';
import BookingPanel from './BookingPanel';
import { bookingApi } from '../../api/bookingApi';

interface ConversationDetailPaneProps {
  conversationId: string | null;
  currentUserId: string;
  onReviewClick?: () => void;
  onViewUserDetails?: () => void;
}

type Tab = 'chat' | 'booking';

/**
 * The right-hand pane of the conversation hub: the selected chat with its
 * booking alongside it.
 *
 * Chat and booking are tabbed rather than side-by-side, because the hub already
 * spends a column on the conversation list — the same two-tab shape the mobile
 * conversation view uses, so the two layouts behave consistently.
 */
const ConversationDetailPane: React.FC<ConversationDetailPaneProps> = ({
  conversationId,
  currentUserId,
  onReviewClick,
  onViewUserDetails,
}) => {
  const [tab, setTab] = useState<Tab>('chat');
  const [role, setRole] = useState<'USER' | 'PROVIDER' | null>(null);
  const [resolving, setResolving] = useState(false);

  // Which side the viewer is on decides what the booking panel offers, so it has
  // to be known before that tab can render anything meaningful.
  useEffect(() => {
    if (!conversationId) {
      setRole(null);
      return;
    }

    let alive = true;
    setResolving(true);
    setTab('chat');

    bookingApi
      .getByConversation(conversationId)
      .then((b) => {
        if (!alive) return;
        setRole(b.provider.userId === currentUserId ? 'PROVIDER' : 'USER');
      })
      .catch(() => {
        // No booking (a plain conversation with no service) - treat as customer;
        // the panel renders its own empty state.
        if (alive) setRole('USER');
      })
      .finally(() => alive && setResolving(false));

    return () => {
      alive = false;
    };
  }, [conversationId, currentUserId]);

  if (!conversationId) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
          <MessagesSquare className="h-8 w-8 text-orange-300" />
        </div>
        <h3 className="mb-1 text-lg font-semibold text-gray-900">Pick a conversation</h3>
        <p className="max-w-xs text-sm text-gray-500">
          Choose one on the left to read the messages and manage its booking.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Tabs */}
      <div className="flex flex-shrink-0 gap-1 border-b border-gray-100 px-4 pt-3">
        {([
          { key: 'chat', label: 'Chat', icon: MessageSquare },
          { key: 'booking', label: 'Booking', icon: ClipboardList },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === key
                ? 'border-b-2 border-orange-500 text-orange-700'
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1">
        {resolving ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
          </div>
        ) : (
          <>
            {/* Both stay mounted so switching tabs doesn't reload the thread or
                lose a half-typed message. */}
            <div className={`h-full ${tab === 'chat' ? 'flex flex-col' : 'hidden'}`}>
              <MessageThread />
            </div>
            <div className={`h-full overflow-y-auto ${tab === 'booking' ? 'block' : 'hidden'}`}>
              {role && (
                <BookingPanel
                  key={conversationId}
                  conversationId={conversationId}
                  currentUserRole={role}
                  onReviewClick={onReviewClick}
                  onViewUserDetails={onViewUserDetails}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ConversationDetailPane;
