-- Customer-initiated refunds. A paid booking previously had no recovery path.
CREATE TYPE "RefundStatus" AS ENUM ('PENDING','APPROVED','DECLINED');

CREATE TABLE "RefundRequest" (
  "id" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "bookingId" TEXT,
  "userId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'lkr',
  "reason" TEXT NOT NULL,
  "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
  "decisionNote" TEXT,
  "processedBy" TEXT,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RefundRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RefundRequest_userId_status_idx" ON "RefundRequest"("userId","status");
CREATE INDEX "RefundRequest_status_createdAt_idx" ON "RefundRequest"("status","createdAt");
CREATE INDEX "RefundRequest_paymentId_idx" ON "RefundRequest"("paymentId");
