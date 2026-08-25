-- Read receipt for booking activity, so the notification badge clears on
-- "mark as read" instead of tracking still-open bookings (state, not news).
ALTER TABLE "BookingEvent" ADD COLUMN "readAt" TIMESTAMP(3);
