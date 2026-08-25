-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN "cashReceived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Schedule" ADD COLUMN "cashReceivedAt" TIMESTAMP(3);
