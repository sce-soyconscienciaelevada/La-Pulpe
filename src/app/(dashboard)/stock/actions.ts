"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { recordCount, closeStockPeriod } from "@/lib/stock/period";

export async function saveCount(stockPeriodId: string, productId: string, countedFinalQuantity: number) {
  await requireAdmin();
  await recordCount(stockPeriodId, productId, countedFinalQuantity);
  revalidatePath("/stock");
}

export async function closePeriodAction(periodId: string, nextLabel: string) {
  await requireAdmin();
  const venue = await prisma.venue.findFirstOrThrow();
  await closeStockPeriod(venue.id, periodId, nextLabel);
  revalidatePath("/stock");
  revalidatePath("/inventario");
  revalidatePath("/");
}
