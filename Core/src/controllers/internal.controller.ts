import { Request, Response } from 'express';
import { prisma } from '../utils/database.js';

/**
 * Small read-only endpoints other services (Payment, Chat) use to look up
 * Core-owned data over HTTP instead of querying Core's database directly.
 */
export class InternalController {
  async getUser(req: Request, res: Response) {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        location: true,
        role: true,
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  }

  async getService(req: Request, res: Response) {
    const service = await prisma.service.findUnique({
      where: { id: req.params.id },
      select: { id: true, title: true, price: true, providerId: true },
    });

    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  }

  async getProvider(req: Request, res: Response) {
    const provider = await prisma.serviceProvider.findUnique({
      where: { id: req.params.id },
      select: { id: true, userId: true },
    });

    if (!provider) return res.status(404).json({ message: 'Provider not found' });
    res.json(provider);
  }

  async getProviderByUserId(req: Request, res: Response) {
    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: req.params.userId },
      select: { id: true, userId: true },
    });

    if (!provider) return res.status(404).json({ message: 'Provider not found' });
    res.json(provider);
  }

  async getAdmin(req: Request, res: Response) {
    const admin = await prisma.admin.findUnique({
      where: { id: Number(req.params.id) },
      select: { id: true, username: true, firstName: true, lastName: true },
    });

    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    res.json(admin);
  }
}

export default new InternalController();
