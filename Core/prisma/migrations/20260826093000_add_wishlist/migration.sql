-- Customer save-for-later list.
CREATE TABLE "wishlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_pkey" PRIMARY KEY ("id")
);

-- Saving the same service twice is a no-op rather than a duplicate row.
CREATE UNIQUE INDEX "wishlist_userId_serviceId_key" ON "wishlist"("userId", "serviceId");
CREATE INDEX "wishlist_userId_idx" ON "wishlist"("userId");

ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_serviceId_fkey"
    FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
