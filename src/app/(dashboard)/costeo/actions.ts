"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export async function saveRecipe(
  productId: string,
  yieldServings: number,
  ingredients: { ingredientProductId: string; quantity: number }[]
) {
  await requireAdmin();
  const clean = ingredients.filter((i) => i.ingredientProductId && i.quantity > 0);
  if (clean.length === 0) return;

  await prisma.$transaction(async (tx) => {
    const recipe = await tx.recipe.upsert({
      where: { productId },
      update: { yieldServings },
      create: { productId, yieldServings },
    });
    await tx.recipeIngredient.deleteMany({ where: { recipeId: recipe.id } });
    await tx.recipeIngredient.createMany({
      data: clean.map((i) => ({
        recipeId: recipe.id,
        ingredientProductId: i.ingredientProductId,
        quantity: i.quantity,
        uom: "ML" as const,
      })),
    });
  });

  revalidatePath("/costeo");
}

export async function deleteRecipe(productId: string) {
  await requireAdmin();
  await prisma.recipe.delete({ where: { productId } }).catch(() => {});
  revalidatePath("/costeo");
}
