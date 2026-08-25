import { Request, Response } from 'express';
import { prisma } from '../utils/database.js';
import bookingService from '../services/booking.service.js';

/**
 * Public booking queue for a service. Now sourced from Booking rather than
 * Schedule, so the times shown actually belong to the service being viewed -
 * the old Schedule rows were keyed on (customer, provider) and stamped with an
 * arbitrary serviceId, so a service's page could list someone else's booking.
 */
export const getCurrentScheduleTimes = async (req: Request, res: Response) => {
  try {
    const serviceId = String(req.params.serviceId);
    const queue = await bookingService.getServiceQueue(serviceId);

    res.json({
      success: true,
      data: queue.map((b) => ({
        startTime: b.scheduledStart?.toISOString() ?? null,
        endTime: b.scheduledEnd?.toISOString() ?? null,
        status: b.status,
        // Lets the page distinguish "this listing" from the provider's other
        // commitments, without revealing what those other bookings are.
        isThisService: b.serviceId === String(req.params.serviceId),
      })),
    });
  } catch (error) {
    console.error('Error fetching current schedule times:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// createSchedule / updateSchedule used to live here as empty stubs. They were
// routed but never sent a response, so any request to them held the connection
// open until it timed out. Bookings are created and updated through
// /api/bookings now, so the routes were removed rather than implemented.
