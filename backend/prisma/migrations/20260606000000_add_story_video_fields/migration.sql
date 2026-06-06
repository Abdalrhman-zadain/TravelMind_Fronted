ALTER TABLE "traveler_stories"
ADD COLUMN "description" TEXT,
ADD COLUMN "videoUrl" TEXT,
ADD COLUMN "thumbnailUrl" TEXT,
ADD COLUMN "sponsorCompanyName" TEXT,
ADD COLUMN "viewsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
