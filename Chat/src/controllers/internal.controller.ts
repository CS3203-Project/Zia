import { Request, Response } from 'express';
import { prisma } from '../utils/database.js';

class InternalController {
  async getConversation(req: Request, res: Response) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.id },
      select: { id: true, userIds: true, serviceId: true },
    });

    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    res.json(conversation);
  }
}

export default new InternalController();
