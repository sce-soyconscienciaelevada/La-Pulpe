"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export async function updateFichaTecnica(
  productId: string,
  input: {
    photoUrl: string;
    description: string;
    preparationSteps: string;
    garnish: string;
    glassLabel: string;
  }
) {
  await requireAdmin();
  await prisma.recipe.update({
    where: { productId },
    data: {
      photoUrl: input.photoUrl.trim() || null,
      description: input.description.trim() || null,
      preparationSteps: input.preparationSteps.trim() || null,
      garnish: input.garnish.trim() || null,
      glassLabel: input.glassLabel.trim() || null,
    },
  });
  revalidatePath("/recetario");
  revalidatePath(`/recetario/${productId}`);
}

// A ROW is either liquid (oz filled, costed by "Lt" convention) or solid (gr
// filled, costed by "Kg" convention), same either/or pattern as the source
// Excel's G/I columns — never both at once, see the Piloncillo note in
// scripts/import-carajillos.ts for what happens if a row tries to be both.
export type IngredientRowInput = {
  recipeIngredientId: string | null; // existing row id, or null = new row
  name: string;
  oz: number | null;
  gr: number | null;
  // Only used when `name` doesn't match an existing ingredient product —
  // becomes that new product's costPricePerContainer, on the "1L / 1kg
  // container" convention (servingsPerContainer 33.33 or 1000) so the
  // resulting cost-per-medida/gram matches typing a $/L or $/kg figure
  // straight out of a costing sheet. Ignored for an already-matched product —
  // its real cost lives on the Product record (Productos), never
  // overwritten from here.
  newIngredientCostPerUnit: number | null;
};

function normalize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export async function saveRecipeIngredients(recipeId: string, rows: IngredientRowInput[]) {
  await requireAdmin();

  const recipe = await prisma.recipe.findUniqueOrThrow({
    where: { id: recipeId },
    include: { product: true },
  });
  const venueId = recipe.product.venueId;

  const [existingIngredients, allProducts] = await Promise.all([
    prisma.recipeIngredient.findMany({ where: { recipeId } }),
    prisma.product.findMany({ where: { venueId } }),
  ]);
  const productByNorm = new Map(allProducts.map((p) => [normalize(p.name), p]));
  const keepIds = new Set<string>();

  for (const row of rows) {
    const name = row.name.trim();
    if (!name) continue;

    const useOz = row.oz !== null && row.oz > 0;
    const useGr = !useOz && row.gr !== null && row.gr > 0;
    if (!useOz && !useGr) continue;

    const quantity = useOz ? row.oz! : row.gr!;
    const uom: "ML" | "GRAMOS" = useOz ? "ML" : "GRAMOS";

    let product = productByNorm.get(normalize(name));
    if (!product) {
      product = await prisma.product.create({
        data: {
          venueId,
          categoryId: recipe.product.categoryId,
          name,
          servingsPerContainer: useOz ? 1000 / 30 : 1000,
          costPricePerContainer: row.newIngredientCostPerUnit ?? 0,
          isSellable: true,
          isRecipeIngredient: true,
          currentStock: 0,
        },
      });
      productByNorm.set(normalize(product.name), product);
    }

    if (row.recipeIngredientId) {
      const updated = await prisma.recipeIngredient.update({
        where: { id: row.recipeIngredientId },
        data: { ingredientProductId: product.id, quantity, uom },
      });
      keepIds.add(updated.id);
    } else {
      const created = await prisma.recipeIngredient.create({
        data: { recipeId, ingredientProductId: product.id, quantity, uom },
      });
      keepIds.add(created.id);
    }
  }

  const toDelete = existingIngredients.filter((i) => !keepIds.has(i.id));
  if (toDelete.length > 0) {
    await prisma.recipeIngredient.deleteMany({ where: { id: { in: toDelete.map((i) => i.id) } } });
  }

  revalidatePath(`/recetario/${recipe.productId}`);
  revalidatePath("/recetario");
  revalidatePath("/costeo");
}
