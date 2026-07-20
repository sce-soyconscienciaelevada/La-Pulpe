"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { recordPurchase } from "@/lib/stock/movements";
import type { ReorderStatus } from "@/generated/prisma/enums";

export async function logPurchase(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId"));
  const quantity = Number(formData.get("quantity"));
  const unitCost = Number(formData.get("unitCost"));
  const supplierId = formData.get("supplierId") ? String(formData.get("supplierId")) : undefined;
  const invoiceRef = formData.get("invoiceRef") ? String(formData.get("invoiceRef")) : undefined;

  if (!productId || !quantity || Number.isNaN(unitCost)) return;

  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  const period = await prisma.stockPeriod.findFirst({
    where: { venueId: product.venueId, status: "OPEN" },
  });

  await recordPurchase({
    venueId: product.venueId,
    productId,
    quantity,
    unitCost,
    supplierId,
    invoiceRef,
    stockPeriodId: period?.id,
  });
  revalidatePath("/compras");
  revalidatePath("/inventario");
  revalidatePath("/precios");
}

export async function updateReorderStatus(id: string, status: ReorderStatus) {
  await requireAdmin();
  await prisma.reorderItem.update({ where: { id }, data: { status } });
  revalidatePath("/compras");
}
