// Message ordering utility functions
import type { MessageResponse } from '../api/messagingApi';

/**
 * Sorts messages in chronological order (oldest first, newest last)
 * This ensures consistent ordering regardless of database query results
 */
export function sortMessagesByTimestamp(messages: MessageResponse[]): MessageResponse[] {
  return [...messages].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

/**
 * Inserts a new message in the correct chronological position
 * Maintains the sorted order while adding a new message
 */
export function insertMessageInOrder(messages: MessageResponse[], newMessage: MessageResponse): MessageResponse[] {
  if (messages.some((msg) => msg.id === newMessage.id)) {
    return messages;
  }

  const targetTime = new Date(newMessage.createdAt).getTime();
  let left = 0;
  let right = messages.length;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    const midTime = new Date(messages[mid].createdAt).getTime();
    if (midTime <= targetTime) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  const next = [...messages];
  next.splice(left, 0, newMessage);
  return next;
}

/**
 * Merges older messages with current messages while maintaining chronological order
 * Used for pagination when loading more messages
 */
export function mergeMessagesInOrder(olderMessages: MessageResponse[], currentMessages: MessageResponse[]): MessageResponse[] {
  const deduped = new Map<string, MessageResponse>();
  for (const message of olderMessages) {
    deduped.set(message.id, message);
  }
  for (const message of currentMessages) {
    deduped.set(message.id, message);
  }
  return sortMessagesByTimestamp(Array.from(deduped.values()));
}

/**
 * Validates that messages are in correct chronological order
 * Returns true if messages are properly ordered, false otherwise
 */
export function validateMessageOrder(messages: MessageResponse[]): boolean {
  for (let i = 1; i < messages.length; i++) {
    const currentTime = new Date(messages[i].createdAt).getTime();
    const previousTime = new Date(messages[i - 1].createdAt).getTime();
    
    if (currentTime < previousTime) {
      console.warn('Message ordering violation detected:', {
        current: messages[i],
        previous: messages[i - 1]
      });
      return false;
    }
  }
  return true;
}

/**
 * Debug function to log message ordering information
 */
export function debugMessageOrder(messages: MessageResponse[], context: string): void {
  console.log(`📋 Message Order Debug [${context}]:`, {
    count: messages.length,
    isOrdered: validateMessageOrder(messages),
    firstMessage: messages[0]?.createdAt,
    lastMessage: messages[messages.length - 1]?.createdAt,
    timestamps: messages.map(m => ({ id: m.id, createdAt: m.createdAt }))
  });
}