// Control Temperatura Heladeras — server-only DB helper. Pure/client-safe
// helpers (status calc, week math, day labels) live in fridge-shared.ts —
// importing prisma here would leak Node-only modules into any Client
// Component that imports from this file.

import { prisma } from "@/lib/prisma";
import { DEFAULT_FRIDGE_UNITS } from "./fridge-shared";

// Auto-seeds H1..H6 on first visit — same "getOrCreate" convention as
// getOrCreateOpenMonth in glassware.ts, so there's no separate seed script
// to remember to run for this module.
export async function ensureFridgeUnits(venueId: string) {
  const count = await prisma.fridgeUnit.count({ where: { venueId } });
  if (count > 0) return;
  await prisma.fridgeUnit.createMany({
    data: DEFAULT_FRIDGE_UNITS.map((u, i) => ({
      venueId,
      code: u.code,
      name: u.name,
      sortOrder: i,
    })),
  });
}
