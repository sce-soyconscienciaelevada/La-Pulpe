import { prisma } from "../src/lib/prisma";

type MenuItem = {
  name: string;
  price: number;
  categoryName: string;
  description?: string;
  containerType?: "BOTTLE" | "CAN" | "UNIT";
};

const ALIASES: Record<string, string> = {
  beefeter: "beefeater",
  tankeray: "tanqueray",
};

function normalize(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
  return ALIASES[base] || base;
}

const SIN_ALCOHOL = "Bebidas sin alcohol";
const CON_ALCOHOL = "Bebidas con alcohol";
const CERVEZAS = "Cervezas";
const VINOS = "Vinos y Espumantes";

const MENU: MenuItem[] = [
  // Bebidas sin alcohol
  { name: "Gaseosa (linea Coca Cola) 350 cc", price: 5300, categoryName: SIN_ALCOHOL, containerType: "BOTTLE" },
  { name: "Aguas saborizadas", price: 5400, categoryName: SIN_ALCOHOL, containerType: "BOTTLE" },
  { name: "Agua mineral", price: 5400, categoryName: SIN_ALCOHOL, containerType: "BOTTLE" },
  { name: "Licuados", price: 9300, categoryName: SIN_ALCOHOL, description: "Banana, ananá, durazno y frutilla", containerType: "UNIT" },
  { name: "Gaseosa Grande", price: 11500, categoryName: SIN_ALCOHOL, containerType: "BOTTLE" },
  // Energizantes
  { name: "Speed", price: 6000, categoryName: SIN_ALCOHOL, containerType: "CAN" },
  // Cervezas
  { name: "Patagonia Amber Lager 740 cc", price: 15000, categoryName: CERVEZAS, containerType: "BOTTLE" },
  { name: "Patagonia 24.7 Ipa 740 cc", price: 15000, categoryName: CERVEZAS, containerType: "BOTTLE" },
  { name: "Patagonia Bohemian Pilsener 740 cc", price: 15000, categoryName: CERVEZAS, containerType: "BOTTLE" },
  { name: "Stella Artois 1 lt", price: 15000, categoryName: CERVEZAS, containerType: "BOTTLE" },
  { name: "Corona 650 cc", price: 15000, categoryName: CERVEZAS, containerType: "BOTTLE" },
  { name: "Corona 330 cc", price: 11500, categoryName: CERVEZAS, containerType: "BOTTLE" },
  { name: "Quilmes 1 lt", price: 12500, categoryName: CERVEZAS, containerType: "BOTTLE" },
  { name: "Quilmes Stout 1 lt", price: 12500, categoryName: CERVEZAS, containerType: "BOTTLE" },
  { name: "Quilmes Stout 330 cc", price: 8400, categoryName: CERVEZAS, containerType: "BOTTLE" },
  { name: "Artesanal Pinta (consultar Estilos)", price: 8500, categoryName: CERVEZAS, containerType: "UNIT" },
  // Vinos tintos
  { name: "Cafayate Malbec", price: 16500, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Cafayate Reserva", price: 20500, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Finca La Linda", price: 24500, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Las Perdices Reserva Malbec", price: 30000, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Las Perdices Ala Colorada", price: 42500, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Luigi Bosca Malbec", price: 40500, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Nieto Senetiner Malbec", price: 24000, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Don Nicanor Malbec", price: 45500, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Las Perdices Varietal Malbec", price: 19000, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Salentein Malbec", price: 29000, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Portillo Malbec", price: 16500, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Alma Mora Malbec", price: 16500, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Trapiche Malbec", price: 23000, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Alamos Malbec", price: 23000, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Fond de Cave Malbec", price: 23000, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Terraza Reserva Malbec", price: 35900, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Terraza Origen Chacayes", price: 38000, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Latitud Malbec", price: 19300, categoryName: VINOS, containerType: "BOTTLE" },
  // Vinos blancos
  { name: "Cafayate Torrontes", price: 16500, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Cafayate Cosecha Tardia", price: 16500, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Alma Mora Chardonay", price: 16500, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Portillo Sav Blanc", price: 16500, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Las Perdices Torrontes Dulce", price: 24500, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Santa Julia Chenin", price: 23500, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Norton Cosecha Tardia", price: 19500, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Latitud Chardonnay", price: 23000, categoryName: VINOS, containerType: "BOTTLE" },
  // Espumantes
  { name: "Mumm Extra Brut", price: 34000, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Mumm Lata", price: 11500, categoryName: VINOS, containerType: "CAN" },
  { name: "Baron B Extra Brut", price: 65000, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Salentein Extra Brut", price: 38000, categoryName: VINOS, containerType: "BOTTLE" },
  { name: "Nieto Brut Nature", price: 34000, categoryName: VINOS, containerType: "BOTTLE" },
  // Jarras sin alcohol
  { name: "Jarra Naranja, frutilla, jengibre", price: 12500, categoryName: SIN_ALCOHOL, containerType: "UNIT" },
  { name: "Jarra Limonada", price: 12500, categoryName: SIN_ALCOHOL, containerType: "UNIT" },
  { name: "Jarra Limon, naranja y ananá", price: 12500, categoryName: SIN_ALCOHOL, containerType: "UNIT" },
  // Tragos especiales
  { name: "Aperol Spritz", price: 13500, categoryName: CON_ALCOHOL, description: "Aperol, espumante, soda, naranja.", containerType: "UNIT" },
  { name: "Cynar Julep", price: 13500, categoryName: CON_ALCOHOL, description: "Menta, limón, syrop, jugo de pomelo.", containerType: "UNIT" },
  { name: "Mojito", price: 15000, categoryName: CON_ALCOHOL, description: "Ron, menta, limón, azúcar, soda.", containerType: "UNIT" },
  { name: "Mojito Malibu", price: 15000, categoryName: CON_ALCOHOL, description: "Ron Malibú, menta, limón, azúcar, soda.", containerType: "UNIT" },
  { name: "Bailey's con Helado", price: 15000, categoryName: CON_ALCOHOL, description: "Bailey's, helado de americana, salsa de chocolate.", containerType: "UNIT" },
  { name: "Caipirinha", price: 15000, categoryName: CON_ALCOHOL, description: "Cachaca brasilera, limón, azúcar, hielo frozen.", containerType: "UNIT" },
  { name: "Caipiroshka", price: 15000, categoryName: CON_ALCOHOL, description: "Vodka Sernova, lima, azúcar y hielo", containerType: "UNIT" },
  { name: "Old Fashioned", price: 15000, categoryName: CON_ALCOHOL, description: "Havana Club 7 años, azúcar, Bitter, Angostura, twist de naranja.", containerType: "UNIT" },
  { name: "Jagger Julep", price: 15000, categoryName: CON_ALCOHOL, description: "Jagermeister, jugo de lima, jugo de pomelo, syrop, menta.", containerType: "UNIT" },
  { name: "Caipi Malibu", price: 15000, categoryName: CON_ALCOHOL, description: "Ron Malibú, Ron Havanna, lima y almíbar.", containerType: "UNIT" },
  { name: "Negroni", price: 13500, categoryName: CON_ALCOHOL, description: "Vermut Carpano Rosso, Spirito Blu Gin y Campari", containerType: "UNIT" },
  { name: "Sernova Collins", price: 12500, categoryName: CON_ALCOHOL, description: "Vodka Sernova, jugo de limón, almíbar y soda", containerType: "UNIT" },
  { name: "Moscow Mule", price: 13500, categoryName: CON_ALCOHOL, description: "Vodka Sernova, Ginger Ale y Lima", containerType: "UNIT" },
  { name: "Sernova + Energizante", price: 13500, categoryName: CON_ALCOHOL, containerType: "UNIT" },
  { name: "Expresso Borguetti", price: 13500, categoryName: CON_ALCOHOL, containerType: "UNIT" },
  // Aperitivos clásicos
  { name: "Fernet Branca y Cola", price: 12500, categoryName: CON_ALCOHOL, description: "Fernet Branca con Coca Cola", containerType: "UNIT" },
  { name: "Carpano Originale", price: 13500, categoryName: CON_ALCOHOL, description: "Vermuth Carpano Rosso + Soda + Aceituna", containerType: "UNIT" },
  { name: "Carpano Orange", price: 13500, categoryName: CON_ALCOHOL, description: "Vermuth Carpano Rosso + Soda + Rodaja Naranja", containerType: "UNIT" },
  { name: "Bianco Tonic", price: 13500, categoryName: CON_ALCOHOL, description: "Vermuth Carpano Bianco + Tonica + Rodaja de Limón", containerType: "UNIT" },
  { name: "Blu Gin Tonic", price: 13500, categoryName: CON_ALCOHOL, description: "Spirito Blu Gin, Agua Tónica, Piel de Limón", containerType: "UNIT" },
  { name: "Pun e Mes Tonic", price: 13500, categoryName: CON_ALCOHOL, description: "Vermuth Punt e Mes + Tónica", containerType: "UNIT" },
  { name: "Mint Tonic", price: 13500, categoryName: CON_ALCOHOL, description: "Branca Menta Ricetta Italiana + Tónica", containerType: "UNIT" },
  { name: "Borghetti on the Rocks", price: 13500, categoryName: CON_ALCOHOL, description: "Licor de Café Borghetti, Hielo", containerType: "UNIT" },
  { name: "Negroni Perfetto", price: 29500, categoryName: CON_ALCOHOL, description: "Vermuth Antica Fórmula + Spirito Blu Gin + Campari", containerType: "UNIT" },
  { name: "Campari Orange", price: 13500, categoryName: CON_ALCOHOL, description: "Campari + Jugo de naranja y media rodaja de naranja", containerType: "UNIT" },
  { name: "Campari Tonic", price: 13500, categoryName: CON_ALCOHOL, description: "Campari + Agua tónica y media rodaja de limón", containerType: "UNIT" },
  // Gin
  { name: "Spiritu Blue Gin", price: 13500, categoryName: CON_ALCOHOL, containerType: "BOTTLE" },
  { name: "Beefeter", price: 15600, categoryName: CON_ALCOHOL, containerType: "BOTTLE" },
  { name: "Bombay", price: 18000, categoryName: CON_ALCOHOL, containerType: "BOTTLE" },
  { name: "Tankeray", price: 18000, categoryName: CON_ALCOHOL, containerType: "BOTTLE" },
];

const DRY_RUN = process.env["DRY_RUN"] === "1";

function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN (no writes) ===" : "=== LIVE RUN ===");

  const venue = await prisma.venue.findFirstOrThrow();
  const categories = await prisma.category.findMany({ where: { venueId: venue.id } });
  const categoryByName = new Map(categories.map((c) => [c.name, c]));

  const allProducts = await prisma.product.findMany({ where: { venueId: venue.id } });
  const productByNorm = new Map(allProducts.map((p) => [normalize(p.name), p]));
  const matchedIds = new Set<string>();

  let updated = 0;
  let created = 0;
  const unresolvedCategories: string[] = [];

  for (const item of MENU) {
    const category = categoryByName.get(item.categoryName);
    if (!category) {
      unresolvedCategories.push(`${item.name} -> ${item.categoryName}`);
      continue;
    }
    const existing = productByNorm.get(normalize(item.name));
    if (existing) {
      matchedIds.add(existing.id);
      console.log(`MATCH  "${existing.name}" -> salePricePerServing=${item.price}`);
      if (!DRY_RUN) {
        await prisma.product.update({
          where: { id: existing.id },
          data: { salePricePerServing: item.price },
        });
        if (item.description) {
          await prisma.recipe.upsert({
            where: { productId: existing.id },
            update: { description: item.description },
            create: { productId: existing.id, yieldServings: 1, description: item.description },
          });
        }
      }
      updated++;
    } else {
      console.log(`CREATE "${item.name}" in ${item.categoryName} @ ${item.price}`);
      if (!DRY_RUN) {
        const product = await prisma.product.create({
          data: {
            venueId: venue.id,
            categoryId: category.id,
            name: item.name,
            containerType: item.containerType || "BOTTLE",
            servingsPerContainer: 1,
            costPricePerContainer: 0,
            salePricePerServing: item.price,
            isSellable: true,
            isRecipeIngredient: false,
            currentStock: 0,
          },
        });
        if (item.description) {
          await prisma.recipe.create({
            data: { productId: product.id, yieldServings: 1, description: item.description },
          });
        }
      }
      created++;
    }
  }

  // ── Delete existing products that aren't on the new menu (guarded) ──
  // Batch-fetch usage signals once instead of per-product round trips (a
  // per-product Promise.all loop over ~80 rows timed out the pooled Neon
  // connection with "Authentication timed out" mid-scan).
  const toConsider = allProducts.filter((p) => !matchedIds.has(p.id));

  const [consumptionRows, purchaseRows, recipeIngredientRows, recipeRows] = await Promise.all([
    prisma.consumption.groupBy({ by: ["productId"], _count: { _all: true } }),
    prisma.purchase.groupBy({ by: ["productId"], _count: { _all: true } }),
    prisma.recipeIngredient.groupBy({ by: ["ingredientProductId"], _count: { _all: true } }),
    prisma.recipe.findMany({ select: { productId: true } }),
  ]);
  const consumptionByProduct = new Map(consumptionRows.map((r) => [r.productId, r._count._all]));
  const purchaseByProduct = new Map(purchaseRows.map((r) => [r.productId, r._count._all]));
  const recipeUseByProduct = new Map(recipeIngredientRows.map((r) => [r.ingredientProductId, r._count._all]));
  const productsWithOwnRecipe = new Set(recipeRows.map((r) => r.productId));

  let deleted = 0;
  let skipped = 0;
  const skippedDetail: string[] = [];

  for (const p of toConsider) {
    const consumptionCount = consumptionByProduct.get(p.id) || 0;
    const purchaseCount = purchaseByProduct.get(p.id) || 0;
    const recipeUseCount = recipeUseByProduct.get(p.id) || 0;
    const hasOwnRecipe = productsWithOwnRecipe.has(p.id);

    if (consumptionCount > 0 || purchaseCount > 0) {
      skipped++;
      skippedDetail.push(`${p.name} — tiene ventas/compras registradas (${consumptionCount} consumos, ${purchaseCount} compras)`);
      continue;
    }
    if (recipeUseCount > 0) {
      skipped++;
      skippedDetail.push(`${p.name} — se usa como ingrediente en ${recipeUseCount} receta(s)`);
      continue;
    }

    console.log(`DELETE "${p.name}"`);
    if (!DRY_RUN) {
      // Sequential awaits, not $transaction — the pooled Neon connection
      // couldn't sustain repeated interactive transactions in one run
      // (P2028 "Unable to start a transaction in the given time"). Script
      // is safe to resume: re-run re-queries live state, already-deleted
      // rows simply won't reappear as candidates.
      await prisma.stockCount.deleteMany({ where: { productId: p.id } });
      await prisma.productPriceHistory.deleteMany({ where: { productId: p.id } });
      await prisma.stockAdjustment.deleteMany({ where: { productId: p.id } });
      if (hasOwnRecipe) {
        await prisma.recipe.delete({ where: { productId: p.id } });
      }
      await prisma.product.delete({ where: { id: p.id } });
    }
    deleted++;
  }

  console.log("\n=== Summary ===");
  console.log(`Matched & priced: ${updated}`);
  console.log(`Created new: ${created}`);
  console.log(`Deleted (unused, off-menu): ${deleted}`);
  console.log(`Skipped (protected, still in use): ${skipped}`);
  if (skippedDetail.length) {
    console.log("\nProtected products (kept despite not being on the new menu):");
    for (const d of skippedDetail) console.log(`  - ${d}`);
  }
  if (unresolvedCategories.length) {
    console.log("\nUnresolved categories (menu item skipped entirely):");
    for (const u of unresolvedCategories) console.log(`  - ${u}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
