-- Cover image for the provider profile banner. Nullable: every existing
-- provider predates the field and the banner falls back to a gradient.
ALTER TABLE "ServiceProvider" ADD COLUMN "coverUrl" TEXT;
