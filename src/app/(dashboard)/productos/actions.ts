"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

function num(formData: FormData, key: string): number | null {
  const v = formData.get(key);
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export async function createProduct(formData: FormData) {
  await requireAdmin();
  const venue = await prisma.venue.findFirstOrThrow();
  const product = await prisma.product.create({
    data: {
      venueId: venue.id,
      categoryId: String(formData.get("categoryId")),
      name: String(formData.get("name")),
      containerLabel: (formData.get("containerLabel") as string) || null,
      servingsPerContainer: num(formData, "servingsPerContainer") ?? 1,
      costPricePerContainer: num(formData, "costPricePerContainer") ?? 0,
      salePricePerServing: num(formData, "salePricePerServing"),
      carbonation: (formData.get("carbonation") as "CON_GAS" | "SIN_GAS" | "NA") || "NA",
      emoji: (formData.get("emoji") as string) || null,
      colorHex: (formData.get("colorHex") as string) || null,
      showOnQuickGrid: formData.get("showOnQuickGrid") === "on",
      primarySupplierId: (formData.get("primarySupplierId") as string) || null,
      reorderThreshold: num(formData, "reorderThreshold"),
    },
  });
  revalidatePath("/productos");
  redirect(`/productos/${product.id}`);
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin();
  await prisma.product.update({
    where: { id },
    data: {
      name: String(formData.get("name")),
      categoryId: String(formData.get("categoryId")),
      containerLabel: (formData.get("containerLabel") as string) || null,
      servingsPerContainer: num(formData, "servingsPerContainer") ?? 1,
      costPricePerContainer: num(formData, "costPricePerContainer") ?? 0,
      salePricePerServing: num(formData, "salePricePerServing"),
      carbonation: (formData.get("carbonation") as "CON_GAS" | "SIN_GAS" | "NA") || "NA",
      emoji: (formData.get("emoji") as string) || null,
      colorHex: (formData.get("colorHex") as string) || null,
      showOnQuickGrid: formData.get("showOnQuickGrid") === "on",
      primarySupplierId: (formData.get("primarySupplierId") as string) || null,
      reorderThreshold: num(formData, "reorderThreshold"),
    },
  });

  const price = num(formData, "salePricePerServing");
  if (price !== null) {
    await prisma.productPriceHistory.create({
      data: { productId: id, price, priceType: "SALE" },
    });
  }

  revalidatePath("/productos");
  revalidatePath(`/productos/${id}`);
  revalidatePath("/precios");
  revalidatePath("/registro");
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { id } });
  revalidatePath("/productos");
  redirect("/productos");
}
