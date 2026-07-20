import { prisma } from "@/lib/prisma";

// Weekly stock period lifecycle: open -> counts recorded during the week ->
// close freezes expected (= live currentStock) vs counted (Pablo's physical
// count), writes a single reconciling StockAdjustment for the difference, and
// rolls the counted value forward as next period's initial quantity.

export async function getOpenPeriod(venueId: string) {
  return prisma.stockPeriod.findFirst({ where: { venueId, status: "OPEN" } });
}

export async function recordCount(stockPeriodId: string, productId: string, countedFinalQuantity: number) {
  return prisma.stockCount.update({
    where: { stockPeriodId_productId: { stockPeriodId, productId } },
    data: { countedFinalQuantity },
  });
}

export async function closeStockPeriod(venueId: string, periodId: string, nextLabel: string) {
  return prisma.$transaction(async (tx) => {
    const period = await tx.stockPeriod.findUniqueOrThrow({
      where: { id: periodId },
      include: { counts: { include: { product: true } } },
    });

    const nextPeriod = await tx.stockPeriod.create({
      data: { venueId, label: nextLabel, status: "OPEN" },
    });

    for (const count of period.counts) {
      const expectedFinalQuantity = count.product.currentStock;
      const counted = count.countedFinalQuantity ?? expectedFinalQuantity; // uncounted items assumed to match
      const variance = counted - expectedFinalQuantity;

      await tx.stockCount.update({
        where: { id: count.id },
        data: { expectedFinalQuantity, variance },
      });

      if (variance !== 0) {
        await tx.stockAdjustment.create({
          data: {
            venueId,
            productId: count.productId,
            quantityDelta: variance,
            reason: "PERIOD_CLOSE_RECONCILE",
            note: `Cierre de ${period.label}`,
          },
        });
        await tx.product.update({
          where: { id: count.productId },
          data: { currentStock: counted },
        });
      }

      await tx.stockCount.create({
        data: { stockPeriodId: nextPeriod.id, productId: count.productId, initialQuantity: counted },
      });
    }

    await tx.stockPeriod.update({
      where: { id: periodId },
      data: { status: "CLOSED", closedAt: new Date(), endDate: new Date() },
    });

    return nextPeriod;
  });
}
