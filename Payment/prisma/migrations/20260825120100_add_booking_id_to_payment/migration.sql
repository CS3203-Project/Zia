-- Links a payment to the booking it settles, so the booking can advance to PAID.
ALTER TABLE "Payment" ADD COLUMN "bookingId" TEXT;
CREATE INDEX "Payment_bookingId_idx" ON "Payment"("bookingId");
