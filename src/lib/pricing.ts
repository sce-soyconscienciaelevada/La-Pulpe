// Per-serving profit math — the core "how much do we win per medida" ask.
// Never stored: costPricePerContainer and salePricePerServing are the only
// stored numbers, everything below is computed at read time so it's never stale.

export type PricingInput = {
  costPricePerContainer: number;
  servingsPerContainer: number;
  salePricePerServing: number | null;
};

export type Pricing = {
  costPerServing: number;
  profitPerServing: number | null;
  marginPercent: number | null;
};

export function computePricing(p: PricingInput): Pricing {
  const costPerServing =
    p.servingsPerContainer > 0 ? p.costPricePerContainer / p.servingsPerContainer : 0;

  if (p.salePricePerServing === null || p.salePricePerServing === undefined) {
    return { costPerServing, profitPerServing: null, marginPercent: null };
  }

  const profitPerServing = p.salePricePerServing - costPerServing;
  const marginPercent =
    p.salePricePerServing > 0 ? (profitPerServing / p.salePricePerServing) * 100 : 0;

  return { costPerServing, profitPerServing, marginPercent };
}
