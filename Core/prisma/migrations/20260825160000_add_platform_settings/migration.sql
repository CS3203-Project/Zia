-- Admin-editable platform configuration. Key/value so adding a setting doesn't
-- need a migration; values are typed, defaulted and validated in the service.
CREATE TABLE "PlatformSetting" (
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedBy" TEXT,
  CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("key")
);
