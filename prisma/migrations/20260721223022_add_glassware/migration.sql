-- CreateEnum
CREATE TYPE "GlasswareLocation" AS ENUM ('BARRA', 'DEPOSITO');

-- CreateEnum
CREATE TYPE "GlasswareMonthStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "GlasswareItem" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" "GlasswareLocation" NOT NULL,
    "stockBase" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlasswareItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlasswareMonthPeriod" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" "GlasswareMonthStatus" NOT NULL DEFAULT 'OPEN',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "GlasswareMonthPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlasswareWeekEntry" (
    "id" TEXT NOT NULL,
    "monthPeriodId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlasswareWeekEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlasswareCount" (
    "id" TEXT NOT NULL,
    "weekEntryId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "countedQuantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "GlasswareCount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GlasswareItem_venueId_idx" ON "GlasswareItem"("venueId");

-- CreateIndex
CREATE INDEX "GlasswareMonthPeriod_venueId_idx" ON "GlasswareMonthPeriod"("venueId");

-- CreateIndex
CREATE UNIQUE INDEX "GlasswareWeekEntry_monthPeriodId_weekNumber_key" ON "GlasswareWeekEntry"("monthPeriodId", "weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "GlasswareCount_weekEntryId_itemId_key" ON "GlasswareCount"("weekEntryId", "itemId");

-- AddForeignKey
ALTER TABLE "GlasswareItem" ADD CONSTRAINT "GlasswareItem_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlasswareMonthPeriod" ADD CONSTRAINT "GlasswareMonthPeriod_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlasswareWeekEntry" ADD CONSTRAINT "GlasswareWeekEntry_monthPeriodId_fkey" FOREIGN KEY ("monthPeriodId") REFERENCES "GlasswareMonthPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlasswareCount" ADD CONSTRAINT "GlasswareCount_weekEntryId_fkey" FOREIGN KEY ("weekEntryId") REFERENCES "GlasswareWeekEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlasswareCount" ADD CONSTRAINT "GlasswareCount_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "GlasswareItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
