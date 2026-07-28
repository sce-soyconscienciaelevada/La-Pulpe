-- CreateEnum
CREATE TYPE "PosSalesPeriodStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "countingServingsPerContainer" INTEGER,
ADD COLUMN     "posCode" TEXT;

-- CreateTable
CREATE TABLE "BarInventoryEntry" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "businessDayId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "initialQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "entradas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ventaPunto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "countedPhysical" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BarInventoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FridgeUnit" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FridgeUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FridgeTempEntry" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "tempC" DOUBLE PRECISION,

    CONSTRAINT "FridgeTempEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FridgeIncident" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "tempRecorded" DOUBLE PRECISION,
    "actionTaken" TEXT NOT NULL,
    "responsiblePersonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FridgeIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosSalesPeriod" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" "PosSalesPeriodStatus" NOT NULL DEFAULT 'OPEN',
    "totalUnidades" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "PosSalesPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosSalesCategory" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalTicket" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PosSalesCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosSalesLine" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "posCode" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "unidadesVendidas" DOUBLE PRECISION NOT NULL,
    "productId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PosSalesLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BarInventoryEntry_venueId_idx" ON "BarInventoryEntry"("venueId");

-- CreateIndex
CREATE INDEX "BarInventoryEntry_productId_idx" ON "BarInventoryEntry"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "BarInventoryEntry_businessDayId_productId_key" ON "BarInventoryEntry"("businessDayId", "productId");

-- CreateIndex
CREATE INDEX "FridgeUnit_venueId_idx" ON "FridgeUnit"("venueId");

-- CreateIndex
CREATE INDEX "FridgeTempEntry_unitId_idx" ON "FridgeTempEntry"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "FridgeTempEntry_unitId_date_key" ON "FridgeTempEntry"("unitId", "date");

-- CreateIndex
CREATE INDEX "FridgeIncident_unitId_idx" ON "FridgeIncident"("unitId");

-- CreateIndex
CREATE INDEX "PosSalesPeriod_venueId_idx" ON "PosSalesPeriod"("venueId");

-- CreateIndex
CREATE INDEX "PosSalesPeriod_startAt_idx" ON "PosSalesPeriod"("startAt");

-- CreateIndex
CREATE INDEX "PosSalesCategory_periodId_idx" ON "PosSalesCategory"("periodId");

-- CreateIndex
CREATE INDEX "PosSalesLine_categoryId_idx" ON "PosSalesLine"("categoryId");

-- CreateIndex
CREATE INDEX "PosSalesLine_posCode_idx" ON "PosSalesLine"("posCode");

-- CreateIndex
CREATE INDEX "PosSalesLine_productId_idx" ON "PosSalesLine"("productId");

-- AddForeignKey
ALTER TABLE "BarInventoryEntry" ADD CONSTRAINT "BarInventoryEntry_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarInventoryEntry" ADD CONSTRAINT "BarInventoryEntry_businessDayId_fkey" FOREIGN KEY ("businessDayId") REFERENCES "BusinessDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarInventoryEntry" ADD CONSTRAINT "BarInventoryEntry_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FridgeUnit" ADD CONSTRAINT "FridgeUnit_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FridgeTempEntry" ADD CONSTRAINT "FridgeTempEntry_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "FridgeUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FridgeIncident" ADD CONSTRAINT "FridgeIncident_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "FridgeUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FridgeIncident" ADD CONSTRAINT "FridgeIncident_responsiblePersonId_fkey" FOREIGN KEY ("responsiblePersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosSalesPeriod" ADD CONSTRAINT "PosSalesPeriod_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosSalesCategory" ADD CONSTRAINT "PosSalesCategory_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "PosSalesPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosSalesLine" ADD CONSTRAINT "PosSalesLine_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PosSalesCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosSalesLine" ADD CONSTRAINT "PosSalesLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
