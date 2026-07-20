import { computePricing } from "@/lib/pricing";

// RecipeIngredient.quantity is expressed in "medidas" of the ingredient product
// (not raw ml) — matches how the source Excel and Pablo's own stock sheet think
// about pours (e.g. a Gin Tonic = 1 medida gin + 1 medida tónica), and sidesteps
// unreliable ml-to-medida conversion since pour sizes vary per spirit.

type IngredientRow = {
  quantity: number;
  ingredientProduct: {
    costPricePerContainer: number;
    servingsPerContainer: number;
  };
};

export function computeRecipeCost(ingredients: IngredientRow[], yieldServings: number) {
  const totalCost = ingredients.reduce((sum, ing) => {
    const { costPerServing } = computePricing({
      costPricePerContainer: ing.ingredientProduct.costPricePerContainer,
      servingsPerContainer: ing.ingredientProduct.servingsPerContainer,
      salePricePerServing: null,
    });
    return sum + costPerServing * ing.quantity;
  }, 0);

  return yieldServings > 0 ? totalCost / yieldServings : totalCost;
}
