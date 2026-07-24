"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export async function updateSalePrice(productId: string, salePricePerServing: number) {
  await requireAdmin();
  await prisma.product.update({ where: { id: productId }, data: { salePricePerServing } });
  await prisma.productPriceHistory.create({
    data: { productId, price: salePricePerServing, priceType: "SALE" },
  });
  revalidatePath("/precios");
  revalidatePath("/registro");
  revalidatePath("/");
}

export async function updateCostPrice(productId: string, costPricePerContainer: number) {
  await requireAdmin();
  await prisma.product.update({ where: { id: productId }, data: { costPricePerContainer } });
  await prisma.productPriceHistory.create({
    data: { productId, price: costPricePerContainer, priceType: "COST" },
  });
  revalidatePath("/precios");
  revalidatePath("/costeo");
  revalidatePath("/");
}
