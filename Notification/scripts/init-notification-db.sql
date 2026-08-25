-- TypeORM has synchronize/migrationsRun disabled (see app.module.ts), so this table
-- is never created automatically. Mirrors the `notification` entity in email.entity.ts.
DO $$ BEGIN
  CREATE TYPE "notification_emailType_enum" AS ENUM ('BOOKING_CONFIRMATION', 'BOOKING_REMINDER', 'BOOKING_CANCELLATION_MODIFICATION', 'NEW_MESSAGE_OR_REVIEW', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "notification" (
  "id" uuid NOT NULL,
  "userId" character varying,
  "to" character varying NOT NULL,
  "subject" character varying NOT NULL,
  "html" text NOT NULL,
  "emailType" "notification_emailType_enum" NOT NULL,
  "sentAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL,
  "isRead" boolean NOT NULL DEFAULT false,
  CONSTRAINT "PK_notification_id" PRIMARY KEY ("id")
);

-- Account emails (verify address / reset password).
ALTER TYPE "notification_emailType_enum" ADD VALUE IF NOT EXISTS 'ACCOUNT_VERIFICATION';
ALTER TYPE "notification_emailType_enum" ADD VALUE IF NOT EXISTS 'PASSWORD_RESET';
