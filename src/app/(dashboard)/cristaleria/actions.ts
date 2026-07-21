"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { getOrCreateOpenMonth, addWeekEntry, currentMonthLabel } from "@/lib/glassware";

export async function recordGlasswareCount(weekEntryId: string, itemId: string, countedQuantity: number) {
  await requireAdmin();
  await prisma.glasswareCount.upsert({
    where: { weekEntryId_itemId: { weekEntryId, itemId } },
    update: { countedQuantity },
    create: { weekEntryId, itemId, countedQuantity },
  });
  revalidatePath("/cristaleria");
}

export async function addWeekAction(monthPeriodId: string) {
  await requireAdmin();
  await addWeekEntry(monthPeriodId);
  revalidatePath("/cristaleria");
}

export async function closeMonthAction(monthPeriodId: string, venueId: string) {
  await requireAdmin();
  await prisma.$transaction(async (tx) => {
    await tx.glasswareMonthPeriod.update({
      where: { id: monthPeriodId },
      data: { status: "CLOSED", closedAt: new Date() },
    });
    await tx.glasswareMonthPeriod.create({
      data: { venueId, label: currentMonthLabel(new Date(new Date().setMonth(new Date().getMonth() + 1))) },
    });
  });
  revalidatePath("/cristaleria");
}

export async function createGlasswareItem(input: {
  venueId: string;
  code: string;
  name: string;
  location: "BARRA" | "DEPOSITO";
  stockBase: number;
}) {
  await requireAdmin();
  if (!input.name.trim() || !input.code.trim()) return;
  await prisma.glasswareItem.create({
    data: {
      venueId: input.venueId,
      code: input.code.trim(),
      name: input.name.trim(),
      location: input.location,
      stockBase: input.stockBase || 0,
    },
  });
  revalidatePath("/cristaleria");
}

export async function deleteGlasswareItem(itemId: string) {
  await requireAdmin();
  const countUses = await prisma.glasswareCount.count({ where: { itemId } });
  if (countUses > 0) {
    return { error: "No se puede eliminar: ya tiene conteos registrados en alguna semana." };
  }
  await prisma.glasswareItem.delete({ where: { id: itemId } });
  revalidatePath("/cristaleria");
  return { success: true };
}
