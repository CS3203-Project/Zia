import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import coreClient from '../services/coreClient.service.js';

interface AdminTokenPayload {
  adminId: number;
  username: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: { id: number; username: string; firstName: string; lastName: string };
    }
  }
}

export const adminAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Access token is required' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AdminTokenPayload;

    if (decoded.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const admin = await coreClient.getAdmin(decoded.adminId);
    if (!admin) {
      res.status(401).json({ success: false, message: 'Admin not found' });
      return;
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};
