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

export async function createProductQuick(input: {
  name: string;
  categoryId: string;
  containerLabel: string;
  servingsPerContainer: number;
  costPricePerContainer: number;
  salePricePerServing?: number | null;
}) {
  await requireAdmin();
  if (!input.name.trim() || !input.categoryId) return;
  const category = await prisma.category.findUniqueOrThrow({ where: { id: input.categoryId } });
  await prisma.product.create({
    data: {
      venueId: category.venueId,
      categoryId: input.categoryId,
      name: input.name.trim(),
      containerLabel: input.containerLabel.trim() || null,
      servingsPerContainer: input.servingsPerContainer || 1,
      costPricePerContainer: input.costPricePerContainer || 0,
      salePricePerServing: input.salePricePerServing ?? null,
      isSellable: true,
      isRecipeIngredient: true,
      currentStock: 0,
    },
  });
  revalidatePath("/inventario");
  revalidatePath("/productos");
  revalidatePath("/precios");
  revalidatePath("/costeo");
}

export async function deleteProductFromInventario(productId: string) {
  await requireAdmin();

  const [consumptionCount, purchaseCount, recipeUseCount, hasOwnRecipe, posSalesLineCount, barInventoryCount] =
    await Promise.all([
      prisma.consumption.count({ where: { productId } }),
      prisma.purchase.count({ where: { productId } }),
      prisma.recipeIngredient.count({ where: { ingredientProductId: productId } }),
      prisma.recipe.findUnique({ where: { productId } }),
      prisma.posSalesLine.count({ where: { productId } }),
      prisma.barInventoryEntry.count({ where: { productId } }),
    ]);

  if (consumptionCount > 0 || purchaseCount > 0) {
    return {
      error:
        "No se puede eliminar: tiene ventas o compras registradas. Editalo en Productos y marcalo como no vendible en vez de borrarlo.",
    };
  }
  if (recipeUseCount > 0) {
    return { error: "No se puede eliminar: se usa como ingrediente en una o más recetas." };
  }
  if (posSalesLineCount > 0) {
    return { error: "No se puede eliminar: está vinculado a líneas de Ventas POS." };
  }
  if (barInventoryCount > 0) {
    return { error: "No se puede eliminar: tiene registros en Inventario de Barra." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.stockCount.deleteMany({ where: { productId } });
    await tx.productPriceHistory.deleteMany({ where: { productId } });
    await tx.stockAdjustment.deleteMany({ where: { productId } });
    if (hasOwnRecipe) {
      await tx.recipe.delete({ where: { productId } });
    }
    await tx.product.delete({ where: { id: productId } });
  });

  revalidatePath("/inventario");
  revalidatePath("/productos");
  revalidatePath("/precios");
  revalidatePath("/costeo");
  revalidatePath("/stock");
  revalidatePath("/");
  return { success: true };
}
