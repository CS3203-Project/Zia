-- Payout destination for providers. Bank details, not card details: cards take
-- money rather than send it, and storing a PAN would pull this into PCI scope.
CREATE TABLE "PayoutAccount" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "branch" TEXT,
    "accountNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PayoutAccount_providerId_key" ON "PayoutAccount"("providerId");
CREATE INDEX "PayoutAccount_providerId_idx" ON "PayoutAccount"("providerId");
