-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN "feeLocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Schedule" ADD COLUMN "feeLockedAt" TIMESTAMP(3);
