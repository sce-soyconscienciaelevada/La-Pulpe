// Ventas POS — server-only DB helpers. Pure/client-safe helpers (category
// constant, share/day-length math) live in ventas-pos-shared.ts instead —
// importing prisma here would leak Node-only modules into any Client
// Component that imports from this file.

import { prisma } from "@/lib/prisma";

export async function getOpenPeriod(venueId: string) {
  return prisma.posSalesPeriod.findFirst({
    where: { venueId, status: "OPEN" },
    orderBy: { startAt: "desc" },
  });
}

export async function resolvePreviousPeriod(venueId: string, currentStartAt: Date, excludeId: string) {
  return prisma.posSalesPeriod.findFirst({
    where: { venueId, status: "CLOSED", id: { not: excludeId }, endAt: { lte: currentStartAt } },
    orderBy: { endAt: "desc" },
  });
}
