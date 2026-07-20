-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Argentina/Cordoba',
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venueId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OWNER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'OWNER',
    "avatarColor" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Person_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'BEVERAGE',
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Category_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venueId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'ML',
    "containerLabel" TEXT,
    "containerType" TEXT NOT NULL DEFAULT 'BOTTLE',
    "servingsPerContainer" REAL NOT NULL DEFAULT 1,
    "costPricePerContainer" REAL NOT NULL DEFAULT 0,
    "salePricePerServing" REAL,
    "carbonation" TEXT NOT NULL DEFAULT 'NA',
    "servedInProductId" TEXT,
    "emoji" TEXT,
    "colorHex" TEXT,
    "showOnQuickGrid" BOOLEAN NOT NULL DEFAULT false,
    "quickGridSort" INTEGER,
    "primarySupplierId" TEXT,
    "isSellable" BOOLEAN NOT NULL DEFAULT true,
    "isRecipeIngredient" BOOLEAN NOT NULL DEFAULT false,
    "reorderThreshold" REAL,
    "currentStock" REAL NOT NULL DEFAULT 0,
    "attributes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Product_servedInProductId_fkey" FOREIGN KEY ("servedInProductId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_primarySupplierId_fkey" FOREIGN KEY ("primarySupplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductPriceHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "priceType" TEXT NOT NULL,
    "effectiveDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductPriceHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPhone" TEXT,
    "contactNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Supplier_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BusinessDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venueId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    CONSTRAINT "BusinessDay_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Consumption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venueId" TEXT NOT NULL,
    "businessDayId" TEXT NOT NULL,
    "productId" TEXT,
    "freeText" TEXT,
    "type" TEXT NOT NULL DEFAULT 'SALE',
    "quantity" REAL NOT NULL DEFAULT 1,
    "personId" TEXT,
    "unitPriceCharged" REAL NOT NULL DEFAULT 0,
    "unitCost" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Consumption_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Consumption_businessDayId_fkey" FOREIGN KEY ("businessDayId") REFERENCES "BusinessDay" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Consumption_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Consumption_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReorderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venueId" TEXT NOT NULL,
    "businessDayId" TEXT,
    "supplierId" TEXT,
    "supplierLabel" TEXT,
    "name" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReorderItem_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReorderItem_businessDayId_fkey" FOREIGN KEY ("businessDayId") REFERENCES "BusinessDay" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ReorderItem_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venueId" TEXT NOT NULL,
    "stockPeriodId" TEXT,
    "productId" TEXT NOT NULL,
    "supplierId" TEXT,
    "quantity" REAL NOT NULL,
    "unitCost" REAL NOT NULL,
    "invoiceRef" TEXT,
    "purchaseDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Purchase_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Purchase_stockPeriodId_fkey" FOREIGN KEY ("stockPeriodId") REFERENCES "StockPeriod" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Purchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockAdjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venueId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantityDelta" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockAdjustment_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockAdjustment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockPeriod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venueId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "closedAt" DATETIME,
    CONSTRAINT "StockPeriod_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockCount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stockPeriodId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "initialQuantity" REAL NOT NULL DEFAULT 0,
    "expectedFinalQuantity" REAL,
    "countedFinalQuantity" REAL,
    "variance" REAL,
    CONSTRAINT "StockCount_stockPeriodId_fkey" FOREIGN KEY ("stockPeriodId") REFERENCES "StockPeriod" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockCount_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "yieldServings" REAL NOT NULL DEFAULT 1,
    CONSTRAINT "Recipe_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeId" TEXT NOT NULL,
    "ingredientProductId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "uom" TEXT NOT NULL DEFAULT 'ML',
    CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecipeIngredient_ingredientProductId_fkey" FOREIGN KEY ("ingredientProductId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venueId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "meta" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_SupplierCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_SupplierCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_SupplierCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_venueId_idx" ON "User"("venueId");

-- CreateIndex
CREATE INDEX "Person_venueId_idx" ON "Person"("venueId");

-- CreateIndex
CREATE INDEX "Category_venueId_idx" ON "Category"("venueId");

-- CreateIndex
CREATE INDEX "Product_venueId_idx" ON "Product"("venueId");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "ProductPriceHistory_productId_idx" ON "ProductPriceHistory"("productId");

-- CreateIndex
CREATE INDEX "Supplier_venueId_idx" ON "Supplier"("venueId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessDay_venueId_date_key" ON "BusinessDay"("venueId", "date");

-- CreateIndex
CREATE INDEX "Consumption_venueId_idx" ON "Consumption"("venueId");

-- CreateIndex
CREATE INDEX "Consumption_businessDayId_idx" ON "Consumption"("businessDayId");

-- CreateIndex
CREATE INDEX "Consumption_productId_idx" ON "Consumption"("productId");

-- CreateIndex
CREATE INDEX "ReorderItem_venueId_idx" ON "ReorderItem"("venueId");

-- CreateIndex
CREATE INDEX "Purchase_venueId_idx" ON "Purchase"("venueId");

-- CreateIndex
CREATE INDEX "Purchase_productId_idx" ON "Purchase"("productId");

-- CreateIndex
CREATE INDEX "StockAdjustment_venueId_idx" ON "StockAdjustment"("venueId");

-- CreateIndex
CREATE INDEX "StockAdjustment_productId_idx" ON "StockAdjustment"("productId");

-- CreateIndex
CREATE INDEX "StockPeriod_venueId_idx" ON "StockPeriod"("venueId");

-- CreateIndex
CREATE UNIQUE INDEX "StockCount_stockPeriodId_productId_key" ON "StockCount"("stockPeriodId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_productId_key" ON "Recipe"("productId");

-- CreateIndex
CREATE INDEX "RecipeIngredient_recipeId_idx" ON "RecipeIngredient"("recipeId");

-- CreateIndex
CREATE INDEX "AuditLog_venueId_idx" ON "AuditLog"("venueId");

-- CreateIndex
CREATE UNIQUE INDEX "_SupplierCategories_AB_unique" ON "_SupplierCategories"("A", "B");

-- CreateIndex
CREATE INDEX "_SupplierCategories_B_index" ON "_SupplierCategories"("B");
