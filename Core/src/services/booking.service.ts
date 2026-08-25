import { prisma } from '../utils/database.js';
import chatClient from './chatClient.service.js';
import { recordCashPayment } from './paymentClient.service.js';

export type BookingStatus = 'INQUIRY' | 'QUOTED' | 'ACCEPTED' | 'PAID' | 'COMPLETED' | 'CANCELLED';
export type Actor = 'CUSTOMER' | 'PROVIDER';

export class BookingError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = 'BookingError';
  }
}

// Addresses/coordinates are included so the panel can offer directions once the
// booking is confirmed and the two parties actually need to find each other.
const bookingInclude = {
  service: {
    select: {
      id: true, title: true, images: true, price: true, currency: true,
      address: true, city: true, latitude: true, longitude: true,
    },
  },
  provider: {
    include: {
      user: {
        select: {
          id: true, firstName: true, lastName: true, email: true, phone: true,
          address: true, location: true,
        },
      },
    },
  },
  customer: {
    select: {
      id: true, firstName: true, lastName: true, email: true, phone: true,
      address: true, location: true,
    },
  },
} as const;

/**
 * Who may perform each transition, and what the booking must look like first.
 * Every transition has exactly one owner - this is what replaces the old pair of
 * free-floating confirmation checkboxes that either party could toggle at any time.
 */
const TRANSITIONS: Record<string, { from: BookingStatus[]; actor: Actor }> = {
  QUOTE:    { from: ['INQUIRY', 'QUOTED', 'ACCEPTED'], actor: 'PROVIDER' },
  ACCEPT:   { from: ['QUOTED'],                        actor: 'CUSTOMER' },
  MARK_CASH_PAID: { from: ['ACCEPTED'],                actor: 'PROVIDER' },
  COMPLETE: { from: ['PAID'],                          actor: 'PROVIDER' },
};

/**
 * Resolves who the caller is for a booking. Returns null when the user isn't a
 * participant, so callers can reject rather than silently acting as the wrong party.
 */
export function resolveActor(booking: { customerId: string; provider: { userId: string } }, userId: string): Actor | null {
  if (booking.customerId === userId) return 'CUSTOMER';
  if (booking.provider.userId === userId) return 'PROVIDER';
  return null;
}

function assertTransition(
  action: keyof typeof TRANSITIONS,
  booking: { status: BookingStatus; customerId: string; provider: { userId: string } },
  userId: string
) {
  const rule = TRANSITIONS[action];
  const actor = resolveActor(booking, userId);

  if (!actor) throw new BookingError('You are not a participant in this booking', 403);
  if (actor !== rule.actor) {
    throw new BookingError(
      `Only the ${rule.actor.toLowerCase()} can do this`,
      403
    );
  }
  if (!rule.from.includes(booking.status)) {
    throw new BookingError(
      `Cannot do this while the booking is ${booking.status}`,
      409
    );
  }
  return actor;
}

export const bookingService = {
  /**
   * Gets the booking for a conversation, creating the INQUIRY record on first
   * access. Unlike the old flow this is keyed on the conversation and takes its
   * service from the conversation itself, so two bookings between the same two
   * people for different services stay separate.
   */
  async getOrCreateForConversation(conversationId: string, userId: string) {
    const existing = await prisma.booking.findUnique({
      where: { conversationId },
      include: bookingInclude,
    });
    if (existing) {
      if (!resolveActor(existing, userId)) throw new BookingError('Not authorized for this booking', 403);
      return existing;
    }

    const conversation = await chatClient.getConversation(conversationId);
    if (!conversation) throw new BookingError('Conversation not found', 404);
    if (!conversation.userIds.includes(userId)) throw new BookingError('Not authorized for this conversation', 403);
    if (!conversation.serviceId) {
      throw new BookingError('This conversation is not linked to a service, so it has no booking', 404);
    }

    const service = await prisma.service.findUnique({
      where: { id: conversation.serviceId },
      include: { provider: true },
    });
    if (!service) throw new BookingError('Service not found', 404);

    const customerId = conversation.userIds.find((id: string) => id !== service.provider.userId);
    if (!customerId) throw new BookingError('Could not determine the customer for this booking', 400);

    return prisma.booking.create({
      data: {
        conversationId,
        serviceId: service.id,
        providerId: service.providerId,
        customerId,
        status: 'INQUIRY',
        currency: service.currency || 'LKR',
      },
      include: bookingInclude,
    });
  },

  async getByConversation(conversationId: string) {
    return prisma.booking.findUnique({ where: { conversationId }, include: bookingInclude });
  },

  /**
   * The customer's still-open booking for a service, if any.
   *
   * COMPLETED and CANCELLED are deliberately excluded so a customer can hire the
   * same service again later: a finished booking shouldn't drag them back into
   * the old conversation, it should start a fresh one.
   */
  async findActiveForCustomer(customerId: string, serviceId: string) {
    return prisma.booking.findFirst({
      where: {
        customerId,
        serviceId,
        status: { in: ['INQUIRY', 'QUOTED', 'ACCEPTED', 'PAID'] },
      },
      orderBy: { createdAt: 'desc' },
      include: bookingInclude,
    });
  },

  /** Provider proposes (or revises) price + schedule. Revising resets acceptance. */
  async quote(
    conversationId: string,
    userId: string,
    input: { price: number; currency?: string; scheduledStart: string; scheduledEnd: string; note?: string }
  ) {
    const booking = await this.requireBooking(conversationId);
    assertTransition('QUOTE', booking, userId);

    if (!(input.price > 0)) throw new BookingError('Price must be greater than zero');

    const start = new Date(input.scheduledStart);
    const end = new Date(input.scheduledEnd);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) throw new BookingError('Invalid start or end time');
    if (end <= start) throw new BookingError('End time must be after the start time');

    return prisma.booking.update({
      where: { conversationId },
      data: {
        status: 'QUOTED',
        price: input.price,
        currency: input.currency || booking.currency,
        scheduledStart: start,
        scheduledEnd: end,
        note: input.note ?? booking.note,
        quotedAt: new Date(),
        acceptedAt: null,
      },
      include: bookingInclude,
    });
  },

  /** Customer accepts the quote. Price and schedule are fixed from here on. */
  async accept(conversationId: string, userId: string) {
    const booking = await this.requireBooking(conversationId);
    assertTransition('ACCEPT', booking, userId);

    return prisma.booking.update({
      where: { conversationId },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
      include: bookingInclude,
    });
  },

  /** Provider records an off-platform cash payment. */
  async markCashPaid(conversationId: string, userId: string) {
    const booking = await this.requireBooking(conversationId);
    assertTransition('MARK_CASH_PAID', booking, userId);

    const updated = await prisma.booking.update({
      where: { conversationId },
      data: { status: 'PAID', paymentMethod: 'CASH', paidAt: new Date() },
      include: bookingInclude,
    });

    // Mirror it into Payment/ProviderEarnings so cash bookings still show up in
    // payment history and the provider's earnings, same as an online payment.
    // Isolated: the booking is already paid, so a payment-service blip shouldn't
    // roll that back or block the provider.
    try {
      await recordCashPayment({
        bookingId: updated.id,
        serviceId: updated.serviceId,
        providerId: updated.providerId,
        userId: updated.customerId,
        amount: Number(updated.price ?? 0),
        currency: updated.currency,
      });
    } catch (err) {
      console.error('Booking marked cash-paid but payment record failed:', err);
    }

    return updated;
  },

  /**
   * Called by the payment service once an online payment settles. Trusted
   * internal path, so it takes no actor - the gateway is the authority here.
   */
  async markOnlinePaid(bookingId: string, paymentId: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: bookingInclude });
    if (!booking) throw new BookingError('Booking not found', 404);
    if (booking.status === 'PAID' || booking.status === 'COMPLETED') return booking; // idempotent

    return prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'PAID', paymentMethod: 'ONLINE', paymentId, paidAt: new Date() },
      include: bookingInclude,
    });
  },

  /** Provider marks the work delivered. This is what unlocks reviews. */
  async complete(conversationId: string, userId: string) {
    const booking = await this.requireBooking(conversationId);
    assertTransition('COMPLETE', booking, userId);

    return prisma.booking.update({
      where: { conversationId },
      data: { status: 'COMPLETED', completedAt: new Date() },
      include: bookingInclude,
    });
  },

  /** Either party may cancel, but not once the service is delivered. */
  async cancel(conversationId: string, userId: string, reason?: string) {
    const booking = await this.requireBooking(conversationId);
    const actor = resolveActor(booking, userId);
    if (!actor) throw new BookingError('You are not a participant in this booking', 403);
    if (booking.status === 'COMPLETED') throw new BookingError('A completed booking cannot be cancelled', 409);
    if (booking.status === 'CANCELLED') return booking;
    if (booking.status === 'PAID') {
      throw new BookingError('This booking is already paid - please arrange a refund instead', 409);
    }

    return prisma.booking.update({
      where: { conversationId },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: actor, cancelReason: reason },
      include: bookingInclude,
    });
  },

  async requireBooking(conversationId: string) {
    const booking = await prisma.booking.findUnique({ where: { conversationId }, include: bookingInclude });
    if (!booking) throw new BookingError('Booking not found for this conversation', 404);
    return booking;
  },

  /**
   * The user's booking activity, newest first, grouped per booking so the client
   * can render each booking's pipeline as a timeline.
   */
  async getTimeline(userId: string, limit = 40) {
    const events = await prisma.bookingEvent.findMany({
      where: { OR: [{ customerId: userId }, { providerUserId: userId }] },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        booking: {
          select: {
            id: true, conversationId: true, status: true, price: true, currency: true,
            scheduledStart: true,
            service: { select: { id: true, title: true, images: true } },
          },
        },
      },
    });

    // Group into one entry per booking, keeping each booking's events in order.
    const byBooking = new Map<string, any>();
    for (const e of events) {
      const key = e.bookingId;
      if (!byBooking.has(key)) {
        byBooking.set(key, {
          bookingId: key,
          conversationId: e.booking.conversationId,
          status: e.booking.status,
          price: e.booking.price,
          currency: e.booking.currency,
          scheduledStart: e.booking.scheduledStart,
          service: e.booking.service,
          role: e.customerId === userId ? 'CUSTOMER' : 'PROVIDER',
          lastActivityAt: e.createdAt,
          events: [],
        });
      }
      byBooking.get(key).events.push({
        id: e.id,
        event: e.event,
        status: e.status,
        message: e.message,
        createdAt: e.createdAt,
        byMe: e.actorId === userId,
      });
    }

    return Array.from(byBooking.values()).map((b) => ({
      ...b,
      events: [...b.events].reverse(), // oldest -> newest within a booking
    }));
  },

  /** Publicly visible upcoming schedule for a service (the booking queue). */
  async getServiceQueue(serviceId: string) {
    return prisma.booking.findMany({
      where: {
        serviceId,
        status: { in: ['ACCEPTED', 'PAID'] },
        scheduledStart: { gte: new Date() },
      },
      select: { scheduledStart: true, scheduledEnd: true, status: true },
      orderBy: { scheduledStart: 'asc' },
      take: 10,
    });
  },

  /**
   * True when `customerId` has actually completed a booking for `serviceId`.
   * Guards service reviews so ratings can only come from real, delivered work.
   */
  async hasCompletedServiceBooking(customerId: string, serviceId: string) {
    const count = await prisma.booking.count({
      where: { customerId, serviceId, status: 'COMPLETED' },
    });
    return count > 0;
  },

  /** True when this provider-user has completed a booking for this customer. */
  async hasCompletedBookingWithCustomer(providerUserId: string, customerId: string) {
    const count = await prisma.booking.count({
      where: { customerId, status: 'COMPLETED', provider: { userId: providerUserId } },
    });
    return count > 0;
  },

  /** Whether a given user may review this booking yet (COMPLETED only). */
  async canReview(conversationId: string, userId: string) {
    const booking = await prisma.booking.findUnique({ where: { conversationId }, include: bookingInclude });
    if (!booking) return { allowed: false, reason: 'No booking for this conversation' };
    const actor = resolveActor(booking, userId);
    if (!actor) return { allowed: false, reason: 'Not a participant' };
    if (booking.status !== 'COMPLETED') {
      return { allowed: false, reason: 'You can leave a review once the service is marked complete' };
    }
    return { allowed: true, booking, actor };
  },
};

export default bookingService;
