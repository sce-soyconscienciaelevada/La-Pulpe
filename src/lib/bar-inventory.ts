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

// Splits a blended quantity (whole bottles + the currently-open bottle's
// remaining fraction) into its two parts for display — matches the source
// SOP's own convention exactly: "Botella cerrada = 1 pieza = 1.0"; a value
// like 2.7 means 2 sealed piezas plus one open bottle marked at 0.7 (7 of
// its 10 counted puntos remain). No schema change needed — this is purely
// a read-time decomposition of the same number already stored.
export function splitClosedOpen(totalQuantity: number): { closedPiezas: number; openFraction: number } {
  const closedPiezas = Math.floor(totalQuantity + 1e-9); // tiny epsilon guards float rounding (2.9999999 -> 3)
  const openFraction = Math.max(0, totalQuantity - closedPiezas);
  return { closedPiezas, openFraction };
}

// `totalPoints` is the product's own configured scale (Product.countingServingsPerContainer,
// e.g. 10 per the SOP default, but Joan can set a different value per product) — the
// denominator must always match that, never assume 10, or a product configured
// differently would show a wrong fraction and stop being comparable to Referencia Registro
// (which already divides by the real per-product count).
export function formatClosedOpen(totalQuantity: number, totalPoints: number = 10): string {
  const { closedPiezas, openFraction } = splitClosedOpen(totalQuantity);
  if (openFraction < 0.05) return `${closedPiezas} cerrada${closedPiezas === 1 ? "" : "s"}`;
  const puntos = Math.round(openFraction * totalPoints);
  return `${closedPiezas} cerrada${closedPiezas === 1 ? "" : "s"} + abierta (${puntos}/${totalPoints})`;
}

// Compact form for narrow PDF table columns, e.g. "2 + 7/10" or just "2".
export function formatClosedOpenCompact(totalQuantity: number, totalPoints: number = 10): string {
  const { closedPiezas, openFraction } = splitClosedOpen(totalQuantity);
  if (openFraction < 0.05) return `${closedPiezas}`;
  const puntos = Math.round(openFraction * totalPoints);
  return `${closedPiezas}+${puntos}/${totalPoints}`;
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
    // First time this product ever appears here: seed from the stock number
    // Inventario already tracks (currentStock, in containers/piezas — same
    // unit this module uses) instead of defaulting to 0. Every day after
    // that, yesterday's Final Teórico rolls forward per the SOP's own rule.
    const initialQuantity = previous
      ? computeFinalTeorico(previous.initialQuantity, previous.entradas, previous.ventaPunto)
      : product.currentStock;

    await prisma.barInventoryEntry.create({
      data: { venueId, businessDayId, productId: product.id, initialQuantity },
    });
  }
}
