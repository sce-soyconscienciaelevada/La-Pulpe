import { prisma } from "@/lib/prisma";
import { computeRecipeCost } from "@/lib/costeo";
import { PageHeader } from "@/components/ui";
import { RecipeEditor } from "./RecipeEditor";

export default async function CosteoPage() {
  const venue = await prisma.venue.findFirstOrThrow();

  const recipes = await prisma.recipe.findMany({
    where: { product: { venueId: venue.id } },
    include: {
      product: { include: { category: true } },
      ingredients: { include: { ingredientProduct: true } },
    },
  });

  const allSellable = await prisma.product.findMany({
    where: { venueId: venue.id, isSellable: true },
    orderBy: { name: "asc" },
  });
  const withRecipe = new Set(recipes.map((r) => r.productId));
  const candidateProducts = allSellable.filter((p) => !withRecipe.has(p.id));

  const ingredientOptions = await prisma.product.findMany({
    where: { venueId: venue.id, isRecipeIngredient: true },
    orderBy: { name: "asc" },
  });

  const existingRecipes = recipes.map((r) => ({
    productId: r.productId,
    productName: r.product.name,
    productCategoryName: r.product.category?.name ?? null,
    yieldServings: r.yieldServings,
    costPerServing: computeRecipeCost(r.ingredients, r.yieldServings),
    salePricePerServing: r.product.salePricePerServing,
    ingredients: r.ingredients.map((i) => ({
      ingredientProductId: i.ingredientProductId,
      name: i.ingredientProduct.name,
      quantity: i.quantity,
    })),
  }));

  return (
    <div>
      <PageHeader
        title="Costeo & Recetas"
        subtitle="El costo se calcula en vivo a partir de las medidas — nunca queda desactualizado"
      />
      <RecipeEditor
        candidateProducts={candidateProducts.map((p) => ({ id: p.id, name: p.name }))}
        ingredientOptions={ingredientOptions.map((p) => ({ id: p.id, name: p.name }))}
        existingRecipes={existingRecipes}
      />
    </div>
  );
}
