"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { todayInTz } from "@/lib/day-boundary";

// Stamps "day one". From here on Inicio shows the venue's own numbers instead
// of the sample figures, and anything recorded before today (test rows, the
// duplicate BusinessDay rows from the old timezone bug) is ignored.
export async function empezarDatosReales() {
  await requireAdmin();
  const venue = await prisma.venue.findFirstOrThrow();

  // Idempotent: if it is already set, leave the original date alone. Pressing
  // twice must never silently move day one forward and hide real history.
  if (venue.realDataStartedAt) return;

  await prisma.venue.update({
    where: { id: venue.id },
    data: { realDataStartedAt: todayInTz() },
  });

  revalidatePath("/");
  revalidatePath("/estadisticas");
}
