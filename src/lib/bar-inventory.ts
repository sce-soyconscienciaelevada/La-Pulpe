// Inventario de Barra — daily point-based shrinkage detection for opened
// spirit bottles. Separate from Stock semanal (weekly, all categories).
// A product opts in simply by having Product.countingServingsPerContainer
// set — no category taxonomy gate, since the live catalog's categories don't
// line up with the point-tracking SOP's spirit sub-types (Ron/Vodka/Whisky…
// all currently sit under one umbrella "Bebidas con alcohol" category).
// finalTeorico/variance are computed at read time, never stored — same
// convention as pricing.ts.

import { prisma } from "@/lib/prisma";

export function computeFinalTeorico(initialQuantity: number, entradas: number, ventaPunto: number): number {
  return initialQuantity + entradas - ventaPunto;
}

export function computeVariance(countedPhysical: number | null, finalTeorico: number): number | null {
  if (countedPhysical === null || countedPhysical === undefined) return null;
  return countedPhysical - finalTeorico;
}

// Auto-provisions today's BarInventoryEntry for every point-tracked product,
// rolling yesterday's Final Teórico into today's Existencia Inicial — same
// rule as the paper SOP's own "Paso 6" (cierre del ciclo).
export async function ensureTodayEntries(venueId: string, businessDayId: string) {
  const products = await prisma.product.findMany({
    where: { venueId, countingServingsPerContainer: { not: null } },
  });

  for (const product of products) {
    const existing = await prisma.barInventoryEntry.findUnique({
      where: { businessDayId_productId: { businessDayId, productId: product.id } },
    });
    if (existing) continue;

    const previous = await prisma.barInventoryEntry.findFirst({
      where: { productId: product.id, businessDayId: { not: businessDayId } },
      orderBy: { createdAt: "desc" },
    });
    const initialQuantity = previous
      ? computeFinalTeorico(previous.initialQuantity, previous.entradas, previous.ventaPunto)
      : 0;

    await prisma.barInventoryEntry.create({
      data: { venueId, businessDayId, productId: product.id, initialQuantity },
    });
  }
}
