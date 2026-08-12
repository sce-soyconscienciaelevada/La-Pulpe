import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, BackLink } from "@/components/ui";
import { computePricing } from "@/lib/pricing";
import { FichaTecnicaForm } from "./FichaTecnicaForm";
import { IngredientGrid } from "./IngredientGrid";

export default async function FichaTecnicaPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { productId },
    include: {
      product: true,
      ingredients: { include: { ingredientProduct: true } },
    },
  });
  if (!recipe) notFound();

  const venueIngredientProducts = await prisma.product.findMany({
    where: { venueId: recipe.product.venueId, isRecipeIngredient: true },
  });
  const knownIngredients = venueIngredientProducts.map((p) => ({
    norm: p.name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " "),
    name: p.name,
    costPerServing: computePricing({
      costPricePerContainer: p.costPricePerContainer,
      servingsPerContainer: p.servingsPerContainer,
      salePricePerServing: null,
    }).costPerServing,
  }));

  const initialRows = recipe.ingredients.map((i) => ({
    recipeIngredientId: i.id,
    name: i.ingredientProduct.name,
    oz: i.uom === "ML" ? i.quantity : null,
    gr: i.uom === "GRAMOS" ? i.quantity : null,
    costPerServing: computePricing({
      costPricePerContainer: i.ingredientProduct.costPricePerContainer,
      servingsPerContainer: i.ingredientProduct.servingsPerContainer,
      salePricePerServing: null,
    }).costPerServing,
  }));

  return (
    <div>
      <BackLink href="/recetario" label="Volver a Recetario" />
      <PageHeader title={recipe.product.name} subtitle="Ficha técnica" />

      <div className="grid lg:grid-cols-2 gap-4">
        <FichaTecnicaForm
          productId={productId}
          initial={{
            photoUrl: recipe.photoUrl ?? "",
            description: recipe.description ?? "",
            preparationSteps: recipe.preparationSteps ?? "",
            garnish: recipe.garnish ?? "",
            glassLabel: recipe.glassLabel ?? "",
          }}
        />

        <div className="space-y-4">
          <IngredientGrid recipeId={recipe.id} initialRows={initialRows} knownIngredients={knownIngredients} />

          <a
            href={`/api/reportes/ficha-tecnica?productId=${productId}`}
            target="_blank"
            rel="noreferrer"
            className="block text-center rounded-lg border border-border text-text font-semibold py-3"
          >
            🖨️ Imprimir ficha técnica
          </a>
        </div>
      </div>
    </div>
  );
}
