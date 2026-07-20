"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { recordPurchase, recordAdjustment } from "@/lib/stock/movements";
import { prisma } from "@/lib/prisma";

export async function quickAddStock(productId: string, quantity: number) {
  await requireAdmin();
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  await recordPurchase({
    venueId: product.venueId,
    productId,
    quantity,
    unitCost: product.costPricePerContainer,
  });
  revalidatePath("/inventario");
  revalidatePath("/");
}

export async function quickRemoveStock(
  productId: string,
  quantity: number,
  reason: "BREAKAGE" | "WASTE" | "OTHER"
) {
  await requireAdmin();
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  await recordAdjustment({
    venueId: product.venueId,
    productId,
    quantityDelta: -Math.abs(quantity),
    reason,
  });
  revalidatePath("/inventario");
  revalidatePath("/");
}
