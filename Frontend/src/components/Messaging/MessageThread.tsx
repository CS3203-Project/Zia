import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useMessaging } from './MessagingProvider';
import { userApi, type UserProfile } from '../../api/userApi';
import type { MessageResponse } from '../../api/messagingApi';

interface MessageThreadProps {
  className?: string;
}

interface MessageGroup {
  date: string;
  messages: MessageResponse[];
}

export const MessageThread: React.FC<MessageThreadProps> = ({ className = '' }) => {
  const {
    messages,
    activeConversation,
    loading,
    error,
    sendMessage,
    loadMoreMessages,
    currentUserId,
    checkUserOnlineStatus,
  } = useMessaging();

  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [contactProfile, setContactProfile] = useState<UserProfile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const previousConversationIdRef = useRef<string | null>(null);
  const previousMessageCountRef = useRef(0);
  const preserveScrollRef = useRef<{ height: number; top: number } | null>(null);
  const loadingOlderMessagesRef = useRef(false);

  useEffect(() => {
    const fetchContactProfile = async () => {
      if (!activeConversation || !currentUserId) {
        setContactProfile(null);
        return;
      }

      const otherUserId = activeConversation.userIds.find((id) => id !== currentUserId);
      if (!otherUserId) {
        setContactProfile(null);
        return;
      }

      try {
        const profile = await userApi.getUserById(otherUserId);
        setContactProfile(profile);
      } catch (fetchError) {
        console.error('Failed to fetch contact profile:', fetchError);
        setContactProfile({
          id: otherUserId,
          firstName: 'Unknown',
          lastName: 'User',
          email: `${otherUserId}@example.com`,
          role: 'USER',
          location: '',
          phone: '',
          createdAt: '',
          isEmailVerified: false,
        } as UserProfile);
      }
    };

    fetchContactProfile();
  }, [activeConversation, currentUserId]);

  useEffect(() => {
    const textArea = textAreaRef.current;
    if (!textArea) {
      return;
    }

    textArea.style.height = 'auto';
    const scrollHeight = textArea.scrollHeight;
    textArea.style.height = `${Math.min(scrollHeight, 140)}px`;
    textArea.style.overflowY = scrollHeight > 140 ? 'auto' : 'hidden';
  }, [newMessage]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    if (loadingOlderMessagesRef.current && preserveScrollRef.current) {
      const { height, top } = preserveScrollRef.current;
      const heightDelta = container.scrollHeight - height;
      container.scrollTop = top + heightDelta;
      loadingOlderMessagesRef.current = false;
      preserveScrollRef.current = null;
    }
  }, [messages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) {
      previousConversationIdRef.current = activeConversation?.id ?? null;
      previousMessageCountRef.current = messages.length;
      return;
    }

    const conversationChanged = previousConversationIdRef.current !== (activeConversation?.id ?? null);
    const messageCountIncreased = messages.length > previousMessageCountRef.current;
    const nearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 120;

    if ((conversationChanged || (messageCountIncreased && nearBottom)) && messages.length > 0) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ block: 'end' });
      });
    }

    previousConversationIdRef.current = activeConversation?.id ?? null;
    previousMessageCountRef.current = messages.length;
  }, [messages, activeConversation?.id]);

  const otherUserId = activeConversation?.userIds.find((id) => id !== currentUserId);
  const isContactOnline = otherUserId ? checkUserOnlineStatus(otherUserId) : false;

  const messageGroups = useMemo<MessageGroup[]>(() => {
    const groups = new Map<string, MessageResponse[]>();

    messages.forEach((message) => {
      const dateKey = new Date(message.createdAt).toDateString();
      const group = groups.get(dateKey) ?? [];
      group.push(message);
      groups.set(dateKey, group);
    });

    return Array.from(groups.entries())
      .map(([date, groupedMessages]) => ({
        date,
        messages: groupedMessages,
      }))
      .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());
  }, [messages]);

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }

    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleScroll = async () => {
    const container = messagesContainerRef.current;
    if (!container || loading || container.scrollTop > 24) {
      return;
    }

    loadingOlderMessagesRef.current = true;
    preserveScrollRef.current = {
      height: container.scrollHeight,
      top: container.scrollTop,
    };

    await loadMoreMessages();
  };

  const submitMessage = async () => {
    const content = newMessage.trim();

    if (!content || sending) {
      return;
    }

    try {
      setSending(true);
      await sendMessage(content);
      setNewMessage('');
    } catch (sendError) {
      console.error('Failed to send message:', sendError);
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    await submitMessage();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submitMessage();
    }
  };

  const renderEmptyState = (title: string, description: string) => (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-sm rounded-lg border border-gray-100 bg-gray-50 p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-500">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.26-.95L3 20l1.4-3.72A7.94 7.94 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <p className="text-base font-semibold text-gray-900">{title}</p>
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );

  if (!activeConversation) {
    return (
      <div className={`flex h-full flex-col bg-white ${className}`}>
        {renderEmptyState('No conversation selected', 'Choose a conversation to start messaging.')}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex h-full flex-col bg-white ${className}`}>
        <div className="flex h-full items-center justify-center p-6">
          <div className="max-w-sm rounded-lg border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-base font-semibold text-gray-900">Connection error</p>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const contactName = contactProfile
    ? `${contactProfile.firstName} ${contactProfile.lastName}`.trim()
    : `User ${otherUserId?.slice(-8) ?? 'Unknown'}`;

  return (
    <div className={`flex h-full flex-col bg-white ${className}`}>
      <div className="border-b border-gray-100 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700">
            {contactName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-gray-900">{contactName}</h3>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span
                className={`h-2 w-2 rounded-full ${
                  isContactOnline ? 'bg-emerald-500' : 'bg-gray-300'
                }`}
              />
              <span className={isContactOnline ? 'text-emerald-600' : 'text-gray-400'}>
                {isContactOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        onScroll={() => {
          void handleScroll();
        }}
        className="flex-1 overflow-y-auto bg-gradient-to-b from-orange-50/40 to-white px-4 py-4"
      >
        {loading && messages.length > 0 && (
          <div className="mb-4 flex justify-center">
            <div className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-500 shadow-sm">
              Loading older messages...
            </div>
          </div>
        )}

        {loading && messages.length === 0 ? (
          <div className="space-y-3">
            {[0, 1, 2].map((row) => (
              <div key={row} className={`flex ${row % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className="w-full max-w-xs rounded-2xl bg-gray-100 px-4 py-3 md:max-w-md">
                  <div className="h-3 animate-pulse rounded bg-gray-200" />
                  <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : messageGroups.length === 0 ? (
          renderEmptyState('No messages yet', 'Start the conversation by sending a message.')
        ) : (
          <div className="space-y-6">
            {messageGroups.map((group) => (
              <section key={group.date} className="space-y-3">
                <div className="flex justify-center">
                  <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-500 shadow-sm">
                    {formatDate(group.date)}
                  </span>
                </div>

                <div className="space-y-2">
                  {group.messages.map((message) => {
                    const isOwnMessage = message.fromId === currentUserId;

                    // Booking transitions are posted into the thread as SYSTEM
                    // messages so each side sees the other's actions inline,
                    // rather than only inside the booking panel.
                    if (message.kind === 'SYSTEM') {
                      return (
                        <div key={message.id} className="flex justify-center">
                          <div className="flex max-w-[90%] items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-center">
                            <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-orange-500" />
                            <span className="text-xs text-orange-800">{message.content}</span>
                            <span className="flex-shrink-0 text-[10px] text-orange-400">
                              {formatTime(message.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm md:max-w-[70%] ${
                            isOwnMessage
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                              : 'border border-gray-100 bg-white text-gray-900'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words text-sm leading-6">
                            {message.content}
                          </p>
                          <div
                            className={`mt-2 flex items-center justify-end gap-2 text-[11px] ${
                              isOwnMessage ? 'text-white/70' : 'text-gray-400'
                            }`}
                          >
                            <span>{formatTime(message.createdAt)}</span>
                            {isOwnMessage && <span>{message.receivedAt ? 'Seen' : 'Sent'}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-100 bg-white px-4 py-3">
        <form onSubmit={handleSendMessage} className="flex items-end gap-3">
          <textarea
            ref={textAreaRef}
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message"
            rows={1}
            disabled={sending}
            className="min-h-[44px] max-h-[140px] flex-1 resize-none overflow-hidden rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:bg-white"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="flex h-11 min-w-[88px] items-center justify-center rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
        <p className="mt-2 text-xs text-gray-400">Enter to send. Shift+Enter for a new line.</p>
      </div>
    </div>
  );
};
