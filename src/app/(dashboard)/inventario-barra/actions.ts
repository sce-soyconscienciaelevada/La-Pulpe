"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export async function updateBarInventoryEntry(
  entryId: string,
  patch: { initialQuantity?: number; entradas?: number; ventaPunto?: number; countedPhysical?: number | null }
) {
  await requireAdmin();
  await prisma.barInventoryEntry.update({ where: { id: entryId }, data: patch });
  revalidatePath("/inventario-barra");
}
