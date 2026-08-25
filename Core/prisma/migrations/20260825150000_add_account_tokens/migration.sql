-- Email-verification and password-reset tokens. Stored as SHA-256 hashes so a
-- database leak cannot be replayed to verify an address or seize an account.
ALTER TABLE "User" ADD COLUMN "emailVerifyTokenHash" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerifyExpiresAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "passwordResetTokenHash" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordResetExpiresAt" TIMESTAMP(3);
CREATE INDEX "User_emailVerifyTokenHash_idx" ON "User"("emailVerifyTokenHash");
CREATE INDEX "User_passwordResetTokenHash_idx" ON "User"("passwordResetTokenHash");
