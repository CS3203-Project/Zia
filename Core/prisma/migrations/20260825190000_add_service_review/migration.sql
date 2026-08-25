-- Listing moderation, separate from isActive (the provider's own on/off switch).
-- Defaults to APPROVED so existing listings and default behaviour are unchanged.
CREATE TYPE "ServiceReviewStatus" AS ENUM ('PENDING','APPROVED','REJECTED');

ALTER TABLE "Service" ADD COLUMN "reviewStatus" "ServiceReviewStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "Service" ADD COLUMN "reviewNote" TEXT;
ALTER TABLE "Service" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Service" ADD COLUMN "reviewedBy" TEXT;

CREATE INDEX "Service_reviewStatus_idx" ON "Service"("reviewStatus");
