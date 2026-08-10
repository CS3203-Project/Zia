import { Request, Response } from 'express';
import messagingService from '../services/messaging.service.js';

function getActorId(req: Request): string {
  const header = req.headers['x-user-id'];
  const actor = (Array.isArray(header) ? header[0] : header) || (req.query.userId as string);
  if (!actor) throw new Error('actor user id is required');
  return actor;
}

class MessagingController {
  async createConversation(req: Request, res: Response) {
    try {
      const { userIds, title } = req.body;
      const conversation = await messagingService.createConversation(userIds, title);
      res.status(201).json(conversation);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to create conversation' });
    }
  }

  async getConversations(req: Request, res: Response) {
    try {
      const { userId, page = '1', limit = '10' } = req.query as Record<string, string>;
      if (!userId) return res.status(400).json({ message: 'userId is required' });
      const result = await messagingService.getConversations(userId, Number(page), Number(limit));
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to get conversations' });
    }
  }

  async getConversationsWithLastMessage(req: Request, res: Response) {
    try {
      const { userId, page = '1', limit = '10' } = req.query as Record<string, string>;
      if (!userId) return res.status(400).json({ message: 'userId is required' });
      const result = await messagingService.getConversationsWithLastMessage(userId, Number(page), Number(limit));
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to get enhanced conversations' });
    }
  }

  async getConversationById(req: Request, res: Response) {
    try {
      const conversation = await messagingService.findConversationById(req.params.id);
      res.json(conversation);
    } catch (error) {
      res.status(404).json({ message: error instanceof Error ? error.message : 'Conversation not found' });
    }
  }

  async findConversationByParticipants(req: Request, res: Response) {
    const conversation = await messagingService.findConversationByParticipants(
      req.params.participantOne,
      req.params.participantTwo
    );

    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    res.json(conversation);
  }

  async deleteConversation(req: Request, res: Response) {
    try {
      await messagingService.deleteConversation(req.params.id, getActorId(req));
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to delete conversation' });
    }
  }

  async markConversationAsRead(req: Request, res: Response) {
    try {
      await messagingService.markConversationAsRead(req.params.id, getActorId(req));
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to mark conversation as read' });
    }
  }

  async sendMessage(req: Request, res: Response) {
    try {
      const message = await messagingService.sendMessage(req.body);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to send message' });
    }
  }

  async getMessages(req: Request, res: Response) {
    try {
      const { conversationId, page = '1', limit = '20' } = req.query as Record<string, string>;
      if (!conversationId) return res.status(400).json({ message: 'conversationId is required' });
      const result = await messagingService.getMessages(conversationId, Number(page), Number(limit));
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to get messages' });
    }
  }

  async getMessagesBetweenUsers(req: Request, res: Response) {
    try {
      const { page = '1', limit = '50' } = req.query as Record<string, string>;
      const result = await messagingService.getMessagesBetweenUsers(
        req.params.userOne,
        req.params.userTwo,
        Number(page),
        Number(limit)
      );
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to get messages between users' });
    }
  }

  async getMessageById(req: Request, res: Response) {
    try {
      const message = await messagingService.getMessageById(req.params.id);
      res.json(message);
    } catch (error) {
      res.status(404).json({ message: error instanceof Error ? error.message : 'Message not found' });
    }
  }

  async markMessageAsRead(req: Request, res: Response) {
    try {
      const message = await messagingService.markMessageAsRead(req.params.id, getActorId(req));
      res.json(message);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to mark message as read' });
    }
  }

  async deleteMessage(req: Request, res: Response) {
    try {
      await messagingService.deleteMessage(req.params.id, getActorId(req));
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to delete message' });
    }
  }

  async getUnreadMessageCount(req: Request, res: Response) {
    const count = await messagingService.getUnreadMessageCount(req.params.userId);
    res.json({ count });
  }
}

export default new MessagingController();
