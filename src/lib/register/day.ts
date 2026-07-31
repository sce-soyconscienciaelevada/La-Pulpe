import { prisma } from "@/lib/prisma";
import { todayInTz } from "@/lib/day-boundary";

// Was `new Date(); d.setHours(0,0,0,0)`, i.e. midnight in the SERVER's timezone.
// On Vercel (UTC) that rolled the business day at 21:00 Cordoba, mid-service,
// and produced duplicate BusinessDay rows for the same real day. Always resolve
// the day in the venue's timezone — see src/lib/day-boundary.ts.
export function todayDateOnly() {
  return todayInTz();
}

export async function getOrCreateBusinessDay(venueId: string, date: Date = todayDateOnly()) {
  return prisma.businessDay.upsert({
    where: { venueId_date: { venueId, date } },
    update: {},
    create: { venueId, date, status: "OPEN" },
  });
}

export async function getDaySummary(businessDayId: string) {
  const consumptions = await prisma.consumption.findMany({
    where: { businessDayId },
    include: { product: { include: { category: true } }, person: true },
    orderBy: { createdAt: "asc" },
  });

  const revenue = consumptions
    .filter((c) => c.type === "SALE")
    .reduce((sum, c) => sum + c.quantity * c.unitPriceCharged, 0);

  const cogs = consumptions.reduce((sum, c) => sum + c.quantity * c.unitCost, 0);

  const byType = {
    SALE: consumptions.filter((c) => c.type === "SALE"),
    OWNER: consumptions.filter((c) => c.type === "OWNER"),
    COMP: consumptions.filter((c) => c.type === "COMP"),
    BAND_ALLOWANCE: consumptions.filter((c) => c.type === "BAND_ALLOWANCE"),
  };

  return {
    consumptions,
    byType,
    revenue,
    cogs,
    profit: revenue - cogs,
  };
}

export async function closeBusinessDay(businessDayId: string) {
  return prisma.businessDay.update({
    where: { id: businessDayId },
    data: { status: "CLOSED", closedAt: new Date() },
  });
}

export async function clearBusinessDay(businessDayId: string) {
  return prisma.$transaction(async (tx) => {
    // Restore stock for any productId-linked consumptions before deleting them.
    const consumptions = await tx.consumption.findMany({
      where: { businessDayId },
      include: { product: true },
    });
    for (const c of consumptions) {
      if (c.productId && c.product) {
        const containers = c.quantity / (c.product.servingsPerContainer || 1);
        await tx.product.update({
          where: { id: c.productId },
          data: { currentStock: { increment: containers } },
        });
      }
    }
    await tx.consumption.deleteMany({ where: { businessDayId } });
    await tx.reorderItem.deleteMany({ where: { businessDayId } });
  });
}
