-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('BUG', 'FEATURE_REQUEST', 'WORKAROUND', 'QUESTION', 'OTHER');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'DONE', 'WONT_FIX');

-- CreateTable
CREATE TABLE "FeedbackItem" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "type" "FeedbackType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'NEW',
    "submittedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "FeedbackItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedbackItem_venueId_idx" ON "FeedbackItem"("venueId");

-- AddForeignKey
ALTER TABLE "FeedbackItem" ADD CONSTRAINT "FeedbackItem_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
