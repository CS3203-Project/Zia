import { Request, Response } from 'express';
import {
  getServicesByReviewStatus,
  setServiceReviewStatus,
} from '../services/services.service.js';

/** Admin: listings in a given moderation state (defaults to those awaiting review). */
export const listServicesForReviewController = async (req: Request, res: Response) => {
  try {
    const status = String(req.query.status || 'PENDING').toUpperCase();
    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid review status' });
    }

    res.json({ success: true, data: await getServicesByReviewStatus(status) });
  } catch (error) {
    console.error('Failed to list services for review:', error);
    res.status(500).json({ success: false, message: 'Failed to load services' });
  }
};

/** Admin: approve or reject a listing. */
export const reviewServiceController = async (req: Request, res: Response) => {
  try {
    const admin = (req as any).admin;
    const status = String(req.body?.status || '').toUpperCase();

    if (status !== 'APPROVED' && status !== 'REJECTED') {
      return res.status(400).json({ success: false, message: 'status must be APPROVED or REJECTED' });
    }

    const updated = await setServiceReviewStatus(
      String(req.params.serviceId),
      status,
      admin?.username || String(admin?.id ?? 'admin'),
      req.body?.note
    );

    res.json({
      success: true,
      message: status === 'APPROVED' ? 'Listing approved' : 'Listing rejected',
      data: updated,
    });
  } catch (error) {
    const status = (error as { status?: number })?.status ?? 500;
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to review listing',
    });
  }
};
