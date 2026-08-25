DO $$ BEGIN
  CREATE TYPE "BookingStatus" AS ENUM ('INQUIRY','QUOTED','ACCEPTED','PAID','COMPLETED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('ONLINE','CASH');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "Booking" (
  "id"             TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "serviceId"      TEXT NOT NULL,
  "providerId"     TEXT NOT NULL,
  "customerId"     TEXT NOT NULL,
  "status"         "BookingStatus" NOT NULL DEFAULT 'INQUIRY',
  "price"          DECIMAL(10,2),
  "currency"       TEXT NOT NULL DEFAULT 'LKR',
  "scheduledStart" TIMESTAMP(3),
  "scheduledEnd"   TIMESTAMP(3),
  "paymentMethod"  "PaymentMethod",
  "paymentId"      TEXT,
  "note"           TEXT,
  "cancelReason"   TEXT,
  "quotedAt"       TIMESTAMP(3),
  "acceptedAt"     TIMESTAMP(3),
  "paidAt"         TIMESTAMP(3),
  "completedAt"    TIMESTAMP(3),
  "cancelledAt"    TIMESTAMP(3),
  "cancelledBy"    TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Booking_conversationId_key" ON "Booking"("conversationId");
CREATE INDEX IF NOT EXISTS "Booking_serviceId_status_scheduledStart_idx" ON "Booking"("serviceId","status","scheduledStart");
CREATE INDEX IF NOT EXISTS "Booking_providerId_status_idx" ON "Booking"("providerId","status");
CREATE INDEX IF NOT EXISTS "Booking_customerId_status_idx" ON "Booking"("customerId","status");
CREATE INDEX IF NOT EXISTS "Booking_status_idx" ON "Booking"("status");

DO $$ BEGIN
  ALTER TABLE "Booking" ADD CONSTRAINT "Booking_providerId_fkey"
    FOREIGN KEY ("providerId") REFERENCES "ServiceProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey"
    FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
-- Backfill Booking from existing conversations that are tied to a service.
-- The service comes from the CONVERSATION (authoritative), not from the old
-- Schedule row, whose serviceId was assigned by "provider's newest service".
INSERT INTO "Booking" (
  "id", "conversationId", "serviceId", "providerId", "customerId",
  "status", "price", "currency", "scheduledStart", "scheduledEnd",
  "paymentMethod", "paidAt", "quotedAt", "acceptedAt", "createdAt", "updatedAt"
)
SELECT
  'bk_' || replace(c."id"::text, '-', ''),
  c."id",
  c."serviceId",
  sv."providerId",
  cust."id",
  CASE
    WHEN sch."cashReceived" IS TRUE THEN 'PAID'::"BookingStatus"
    WHEN sch."customerConfirmation" IS TRUE AND sch."providerConfirmation" IS TRUE
         AND sch."serviceFee" IS NOT NULL THEN 'ACCEPTED'::"BookingStatus"
    WHEN sch."serviceFee" IS NOT NULL THEN 'QUOTED'::"BookingStatus"
    ELSE 'INQUIRY'::"BookingStatus"
  END,
  sch."serviceFee",
  COALESCE(NULLIF(sch."currency", 'RS'), 'LKR'),
  CASE WHEN sch."startTime" ~ '^\d{4}-\d{2}-\d{2}T' THEN sch."startTime"::timestamp ELSE NULL END,
  CASE WHEN sch."endTime"   ~ '^\d{4}-\d{2}-\d{2}T' THEN sch."endTime"::timestamp   ELSE NULL END,
  CASE WHEN sch."cashReceived" IS TRUE THEN 'CASH'::"PaymentMethod" ELSE NULL END,
  sch."cashReceivedAt",
  CASE WHEN sch."serviceFee" IS NOT NULL THEN NOW() ELSE NULL END,
  CASE WHEN sch."customerConfirmation" IS TRUE AND sch."providerConfirmation" IS TRUE
            AND sch."serviceFee" IS NOT NULL THEN NOW() ELSE NULL END,
  NOW(), NOW()
FROM chat."Conversation" c
JOIN "Service" sv        ON sv."id" = c."serviceId"
JOIN "ServiceProvider" p ON p."id"  = sv."providerId"
JOIN "User" cust         ON cust."id" = ANY(c."userIds") AND cust."id" <> p."userId"
LEFT JOIN "Schedule" sch ON sch."userId" = cust."id" AND sch."providerId" = sv."providerId"
WHERE c."serviceId" IS NOT NULL
ON CONFLICT ("conversationId") DO NOTHING;
