-- Append-only log of booking transitions, powering the in-app notification timeline.
CREATE TABLE "BookingEvent" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "providerUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BookingEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BookingEvent_customerId_createdAt_idx" ON "BookingEvent"("customerId","createdAt");
CREATE INDEX "BookingEvent_providerUserId_createdAt_idx" ON "BookingEvent"("providerUserId","createdAt");
CREATE INDEX "BookingEvent_bookingId_createdAt_idx" ON "BookingEvent"("bookingId","createdAt");
ALTER TABLE "BookingEvent" ADD CONSTRAINT "BookingEvent_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
