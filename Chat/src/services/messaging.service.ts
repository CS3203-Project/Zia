import { prisma } from '../utils/database.js';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class MessagingService {
  async createConversation(userIds: string[], title?: string, serviceId?: string) {
    return prisma.conversation.create({
      data: { userIds, title, serviceId },
    });
  }

  async getConversations(userId: string, page: number, limit: number): Promise<PaginatedResponse<any>> {
    const skip = (page - 1) * limit;
    const where = { userIds: { has: userId } };

    const [data, total] = await Promise.all([
      prisma.conversation.findMany({ where, skip, take: limit }),
      prisma.conversation.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getConversationsWithLastMessage(userId: string, page: number, limit: number) {
    const { data: conversations } = await this.getConversations(userId, page, limit);

    return Promise.all(
      conversations.map(async (conversation) => {
        const [lastMessage, unreadCount] = await Promise.all([
          prisma.message.findFirst({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.message.count({
            where: { conversationId: conversation.id, toId: userId, receivedAt: null },
          }),
        ]);

        return { ...conversation, lastMessage: lastMessage || undefined, unreadCount };
      })
    );
  }

  async findConversationById(id: string) {
    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) throw new Error('Conversation not found');
    return conversation;
  }

  async findConversationByParticipants(participantOne: string, participantTwo: string) {
    return prisma.conversation.findFirst({
      where: {
        AND: [{ userIds: { has: participantOne } }, { userIds: { has: participantTwo } }],
      },
    });
  }

  async deleteConversation(conversationId: string, actorUserId: string) {
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation || !conversation.userIds.includes(actorUserId)) {
      throw new Error('Not authorized for this conversation');
    }

    await prisma.message.deleteMany({ where: { conversationId } });
    await prisma.conversation.delete({ where: { id: conversationId } });
  }

  async markConversationAsRead(conversationId: string, actorUserId: string) {
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation || !conversation.userIds.includes(actorUserId)) {
      throw new Error('Not authorized for this conversation');
    }

    await prisma.message.updateMany({
      where: { conversationId, toId: actorUserId, receivedAt: null },
      data: { receivedAt: new Date() },
    });
  }

  async sendMessage(data: { content: string; fromId: string; toId: string; conversationId: string }) {
    const conversation = await prisma.conversation.findUnique({ where: { id: data.conversationId } });
    if (!conversation || !conversation.userIds.includes(data.fromId) || !conversation.userIds.includes(data.toId)) {
      throw new Error('Not authorized for this conversation');
    }

    return prisma.message.create({ data });
  }

  async getMessages(conversationId: string, page: number, limit: number): Promise<PaginatedResponse<any>> {
    const skip = (page - 1) * limit;
    const where = { conversationId };

    const [data, total] = await Promise.all([
      prisma.message.findMany({ where, orderBy: { createdAt: 'asc' }, skip, take: limit }),
      prisma.message.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getMessagesBetweenUsers(userOne: string, userTwo: string, page: number, limit: number): Promise<PaginatedResponse<any>> {
    const skip = (page - 1) * limit;
    const where = {
      OR: [
        { fromId: userOne, toId: userTwo },
        { fromId: userTwo, toId: userOne },
      ],
    };

    const [data, total] = await Promise.all([
      prisma.message.findMany({ where, orderBy: { createdAt: 'asc' }, skip, take: limit }),
      prisma.message.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getMessageById(id: string) {
    const message = await prisma.message.findUnique({ where: { id } });
    if (!message) throw new Error('Message not found');
    return message;
  }

  async markMessageAsRead(id: string, actorUserId: string) {
    const message = await prisma.message.findUnique({ where: { id } });
    if (!message || message.toId !== actorUserId) {
      throw new Error('Not authorized to mark this message as read');
    }

    return prisma.message.update({ where: { id }, data: { receivedAt: new Date() } });
  }

  async deleteMessage(id: string, actorUserId: string) {
    const message = await prisma.message.findUnique({ where: { id } });
    if (!message || (message.fromId !== actorUserId && message.toId !== actorUserId)) {
      throw new Error('Not authorized to delete this message');
    }

    await prisma.message.delete({ where: { id } });
  }

  async getUnreadMessageCount(userId: string) {
    return prisma.message.count({ where: { toId: userId, receivedAt: null } });
  }
}

export default new MessagingService();
