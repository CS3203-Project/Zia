import { Request, Response } from 'express';
import bookingService, { BookingError } from '../services/booking.service.js';
import { queueService } from '../services/queue.service.js';
import { prisma } from '../utils/database.js';

const userIdOf = (req: Request) => (req as any).user?.id as string;

function fail(res: Response, error: unknown) {
  if (error instanceof BookingError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  console.error('Booking error:', error);
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

/**
 * Pushes the updated booking to whichever party is currently viewing the chat,
 * and emails the *other* side. Unlike the old flow this only fires on real state
 * transitions, not on every field edit - changing a currency no longer spams both
 * inboxes with a "your booking was modified" email.
 */
const EVENT_TEXT: Record<string, (b: any, amount: string | null, when: string | null) => string> = {
  QUOTED: (_b, amount, when) => `Quote sent${amount ? `: ${amount}` : ''}${when ? ` for ${when}` : ''}`,
  ACCEPTED: (_b, amount) => `Customer accepted the quote${amount ? ` at ${amount}` : ''}`,
  PAID: (b, amount) =>
    b.paymentMethod === 'CASH'
      ? `Paid in cash${amount ? ` (${amount})` : ''}`
      : `Payment received${amount ? ` (${amount})` : ''}`,
  COMPLETED: () => 'Service marked complete',
  CANCELLED: (b) => `Booking cancelled${b.cancelReason ? `: ${b.cancelReason}` : ''}`,
};

/** Appends the transition to the booking's timeline (drives in-app notifications). */
async function recordEvent(booking: any, event: string) {
  const amount = booking.price != null ? `${booking.currency} ${Number(booking.price).toFixed(2)}` : null;
  const when = booking.scheduledStart ? new Date(booking.scheduledStart).toLocaleString() : null;
  const message = EVENT_TEXT[event]?.(booking, amount, when) ?? event;

  try {
    await prisma.bookingEvent.create({
      data: {
        bookingId: booking.id,
        event,
        status: booking.status,
        message,
        actorId: event === 'ACCEPTED' ? booking.customerId : booking.provider.userId,
        customerId: booking.customerId,
        providerUserId: booking.provider.userId,
      },
    });
  } catch (err) {
    console.error('Failed to record booking event:', err);
  }
}

async function notify(booking: any, event: 'QUOTED' | 'ACCEPTED' | 'PAID' | 'COMPLETED' | 'CANCELLED') {
  await recordEvent(booking, event);

  try {
    await queueService.publishConfirmationUpdate(booking.conversationId, booking, event);
  } catch (err) {
    console.error('Failed to publish booking update:', err);
  }

  const customerName = [booking.customer.firstName, booking.customer.lastName].filter(Boolean).join(' ') || booking.customer.email;
  const providerName = [booking.provider.user.firstName, booking.provider.user.lastName].filter(Boolean).join(' ') || booking.provider.user.email;

  const payload = {
    conversationId: booking.conversationId,
    scheduleId: booking.id,
    customerEmail: booking.customer.email,
    providerEmail: booking.provider.user.email,
    customerName,
    providerName,
    serviceName: booking.service.title || 'Service',
    startDate: booking.scheduledStart?.toISOString?.() ?? undefined,
    endDate: booking.scheduledEnd?.toISOString?.() ?? undefined,
    serviceFee: booking.price ? parseFloat(booking.price.toString()) : undefined,
    currency: booking.currency,
  };

  try {
    if (event === 'PAID' || event === 'COMPLETED' || event === 'ACCEPTED') {
      await queueService.sendBookingConfirmation(payload as any);
    } else {
      await queueService.sendBookingModification({
        ...payload,
        message:
          event === 'QUOTED'
            ? 'The provider has sent you a price and schedule. Open the conversation to accept it.'
            : 'This booking was cancelled.',
      } as any);
    }
  } catch (err) {
    // Never let a mail failure break the booking itself.
    console.error(`Failed to queue ${event} email:`, err);
  }
}

export const getBookingController = async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.getOrCreateForConversation(
      String(req.params.conversationId),
      userIdOf(req)
    );
    res.json({ success: true, data: booking });
  } catch (error) {
    fail(res, error);
  }
};

export const quoteBookingController = async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.quote(String(req.params.conversationId), userIdOf(req), req.body);
    await notify(booking, 'QUOTED');
    res.json({ success: true, data: booking });
  } catch (error) {
    fail(res, error);
  }
};

export const acceptBookingController = async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.accept(String(req.params.conversationId), userIdOf(req));
    await notify(booking, 'ACCEPTED');
    res.json({ success: true, data: booking });
  } catch (error) {
    fail(res, error);
  }
};

export const markCashPaidController = async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.markCashPaid(String(req.params.conversationId), userIdOf(req));
    await notify(booking, 'PAID');
    res.json({ success: true, data: booking });
  } catch (error) {
    fail(res, error);
  }
};

export const completeBookingController = async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.complete(String(req.params.conversationId), userIdOf(req));
    await notify(booking, 'COMPLETED');
    res.json({ success: true, data: booking });
  } catch (error) {
    fail(res, error);
  }
};

export const cancelBookingController = async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.cancel(
      String(req.params.conversationId),
      userIdOf(req),
      req.body?.reason
    );
    await notify(booking, 'CANCELLED');
    res.json({ success: true, data: booking });
  } catch (error) {
    fail(res, error);
  }
};

/**
 * The caller's still-open booking for a service, or null. Lets "Book Now" resume
 * an in-flight booking instead of starting a duplicate, while still allowing a
 * fresh booking once the previous one is finished.
 */
export const getActiveBookingController = async (req: Request, res: Response) => {
  try {
    const booking = await bookingService.findActiveForCustomer(
      userIdOf(req),
      String(req.params.serviceId)
    );
    res.json({ success: true, data: booking });
  } catch (error) {
    fail(res, error);
  }
};

/** Internal: called by the payment service when a refund is approved. */
export const markRefundedController = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }
    const booking = await bookingService.markRefunded(bookingId);
    await notify(booking, 'CANCELLED');
    res.json({ success: true, data: booking });
  } catch (error) {
    fail(res, error);
  }
};

/** The caller's booking activity, grouped per booking, for the notifications timeline. */
export const getBookingTimelineController = async (req: Request, res: Response) => {
  try {
    const timeline = await bookingService.getTimeline(userIdOf(req));
    res.json({ success: true, data: timeline });
  } catch (error) {
    fail(res, error);
  }
};

/** Unread actions by the other party — drives the notification bell badge. */
export const getAttentionCountController = async (req: Request, res: Response) => {
  try {
    const count = await bookingService.countUnreadEvents(userIdOf(req));
    res.json({ success: true, data: { count } });
  } catch (error) {
    fail(res, error);
  }
};

/** Marks the other party's booking actions as read (all, or one booking's). */
export const markEventsReadController = async (req: Request, res: Response) => {
  try {
    const count = await bookingService.markEventsRead(userIdOf(req), req.body?.bookingId);
    res.json({ success: true, data: { count } });
  } catch (error) {
    fail(res, error);
  }
};

/** Public: upcoming confirmed bookings for a service. */
export const getServiceQueueController = async (req: Request, res: Response) => {
  try {
    const queue = await bookingService.getServiceQueue(String(req.params.serviceId));
    res.json({ success: true, data: queue });
  } catch (error) {
    fail(res, error);
  }
};

/** Internal: called by the payment service once an online payment settles. */
export const markOnlinePaidController = async (req: Request, res: Response) => {
  try {
    const { bookingId, paymentId } = req.body;
    if (!bookingId || !paymentId) {
      return res.status(400).json({ success: false, message: 'bookingId and paymentId are required' });
    }
    const booking = await bookingService.markOnlinePaid(bookingId, paymentId);
    await notify(booking, 'PAID');
    res.json({ success: true, data: booking });
  } catch (error) {
    fail(res, error);
  }
};
