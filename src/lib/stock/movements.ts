import { prisma } from "@/lib/prisma";
import type { ConsumptionType, StockAdjustmentReason } from "@/generated/prisma/enums";

// Single write-path for stock changes. currentStock is a denormalized cache —
// every mutation goes through here so it never drifts from the movement ledger
// (Purchase / Consumption / StockAdjustment). Units: currentStock and Purchase
// quantities are in containers; Consumption quantities are in servings and get
// converted here via servingsPerContainer.

export async function recordPurchase(input: {
  venueId: string;
  productId: string;
  quantity: number; // containers
  unitCost: number;
  supplierId?: string;
  invoiceRef?: string;
  stockPeriodId?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.create({
      data: {
        venueId: input.venueId,
        productId: input.productId,
        quantity: input.quantity,
        unitCost: input.unitCost,
        supplierId: input.supplierId,
        invoiceRef: input.invoiceRef,
        stockPeriodId: input.stockPeriodId,
      },
    });
    await tx.product.update({
      where: { id: input.productId },
      data: {
        currentStock: { increment: input.quantity },
        costPricePerContainer: input.unitCost, // latest purchase cost becomes current cost
      },
    });
    await tx.productPriceHistory.create({
      data: { productId: input.productId, price: input.unitCost, priceType: "COST" },
    });
    return purchase;
  });
}

export async function recordConsumption(input: {
  venueId: string;
  businessDayId: string;
  productId?: string;
  freeText?: string;
  type: ConsumptionType;
  quantity: number; // servings
  personId?: string;
  unitPriceCharged?: number;
  unitCost?: number;
}) {
  return prisma.$transaction(async (tx) => {
    let unitCost = input.unitCost ?? 0;
    let unitPriceCharged = input.unitPriceCharged ?? 0;
    let servingsPerContainer = 1;

    if (input.productId) {
      const product = await tx.product.findUniqueOrThrow({ where: { id: input.productId } });
      servingsPerContainer = product.servingsPerContainer || 1;
      if (input.unitCost === undefined) {
        unitCost = product.servingsPerContainer > 0
          ? product.costPricePerContainer / product.servingsPerContainer
          : 0;
      }
      if (input.unitPriceCharged === undefined) {
        unitPriceCharged = input.type === "SALE" ? product.salePricePerServing ?? 0 : 0;
      }
    }

    const consumption = await tx.consumption.create({
      data: {
        venueId: input.venueId,
        businessDayId: input.businessDayId,
        productId: input.productId,
        freeText: input.freeText,
        type: input.type,
        quantity: input.quantity,
        personId: input.personId,
        unitPriceCharged,
        unitCost,
      },
    });

    if (input.productId) {
      const containersUsed = input.quantity / servingsPerContainer;
      await tx.product.update({
        where: { id: input.productId },
        data: { currentStock: { decrement: containersUsed } },
      });
    }

    return consumption;
  });
}

export async function recordAdjustment(input: {
  venueId: string;
  productId: string;
  quantityDelta: number; // containers, signed
  reason: StockAdjustmentReason;
  note?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const adjustment = await tx.stockAdjustment.create({
      data: {
        venueId: input.venueId,
        productId: input.productId,
        quantityDelta: input.quantityDelta,
        reason: input.reason,
        note: input.note,
      },
    });
    await tx.product.update({
      where: { id: input.productId },
      data: { currentStock: { increment: input.quantityDelta } },
    });
    return adjustment;
  });
}
