-- Provider withdrawals. ProviderEarnings already tracked availableBalance and
-- totalWithdrawn, but nothing could move money between them.
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING','PAID','REJECTED');

CREATE TABLE "PayoutRequest" (
  "id" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'lkr',
  "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
  "payoutMethod" TEXT,
  "note" TEXT,
  "rejectReason" TEXT,
  "processedBy" TEXT,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PayoutRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PayoutRequest_providerId_status_idx" ON "PayoutRequest"("providerId","status");
CREATE INDEX "PayoutRequest_status_createdAt_idx" ON "PayoutRequest"("status","createdAt");
