const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || 'http://localhost:3001';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

export interface ChatConversation {
  id: string;
  userIds: string[];
  serviceId: string | null;
}

class ChatClient {
  async getConversation(conversationId: string): Promise<ChatConversation | null> {
    const response = await fetch(`${CHAT_SERVICE_URL}/internal/conversations/${conversationId}`, {
      headers: { 'x-internal-key': INTERNAL_API_KEY },
    });

    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Chat service request failed: ${response.status}`);
    }

    return (await response.json()) as ChatConversation;
  }
}

export default new ChatClient();
