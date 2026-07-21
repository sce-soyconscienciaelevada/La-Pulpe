import { readFileSync } from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

type BebidaRow = {
  section: "sin_alcohol" | "con_alcohol" | "cervezas" | "vinos";
  name: string;
  containerMl: number | null;
  costPricePerContainer: number | null;
  servingsPerContainer: number;
};

async function main() {
  console.log("Seeding Bar Management Dashboard...");

  // ── Venue ──
  const venue = await prisma.venue.upsert({
    where: { id: "venue-la-pulpe" },
    update: {},
    create: { id: "venue-la-pulpe", name: "La Pulpe", currency: "ARS" },
  });

  // ── Admin user (placeholder credentials — change before real handoff) ──
  const passwordHash = await bcrypt.hash("cambiar123", 10);
  await prisma.user.upsert({
    where: { email: "pablo@lapulpe.local" },
    update: {},
    create: {
      venueId: venue.id,
      email: "pablo@lapulpe.local",
      passwordHash,
      role: "OWNER",
    },
  });

  // ── Categories ──
  const categoryDefs = [
    { key: "sin_alcohol", name: "Bebidas sin alcohol", kind: "BEVERAGE" as const },
    { key: "con_alcohol", name: "Bebidas con alcohol", kind: "BEVERAGE" as const },
    { key: "cervezas", name: "Cervezas", kind: "BEVERAGE" as const },
    { key: "vinos", name: "Vinos y Espumantes", kind: "WINE" as const },
    { key: "cristaleria", name: "Cristalería", kind: "GLASSWARE" as const },
    { key: "cafe", name: "Café", kind: "COFFEE" as const },
    { key: "descartables", name: "Descartables", kind: "DISPOSABLE" as const },
    { key: "frutas", name: "Frutas y Extras", kind: "INGREDIENT" as const },
  ];
  const categories: Record<string, { id: string }> = {};
  for (const [i, def] of categoryDefs.entries()) {
    const cat = await prisma.category.upsert({
      where: { id: `cat-${def.key}` },
      update: {},
      create: {
        id: `cat-${def.key}`,
        venueId: venue.id,
        name: def.name,
        kind: def.kind,
        sortOrder: i,
      },
    });
    categories[def.key] = cat;
  }

  // ── Suppliers (matches Pablo's validated mockup grouping + handwritten notes) ──
  const supplierDefs = [
    { key: "quilmes", name: "Quilmes", categoryKeys: ["cervezas"] },
    { key: "coca-cola", name: "Coca-Cola", categoryKeys: ["sin_alcohol"] },
    {
      key: "mosto",
      name: "Mosto · Vinos & Bebidas",
      categoryKeys: ["con_alcohol", "vinos"],
    },
    { key: "frutas-extras", name: "Frutas y Extras", categoryKeys: ["frutas", "descartables"] },
  ];
  const suppliers: Record<string, { id: string }> = {};
  for (const def of supplierDefs) {
    const sup = await prisma.supplier.upsert({
      where: { id: `sup-${def.key}` },
      update: {},
      create: {
        id: `sup-${def.key}`,
        venueId: venue.id,
        name: def.name,
        categories: { connect: def.categoryKeys.map((k) => ({ id: categories[k].id })) },
      },
    });
    suppliers[def.key] = sup;
  }

  // ── Bottle/can/keg catalog from Stock Bebidas.xlsx ──
  const raw = readFileSync(path.join(__dirname, "bebidas.json"), "utf-8");
  const bebidas: BebidaRow[] = JSON.parse(raw);

  const sectionToCategory: Record<BebidaRow["section"], string> = {
    sin_alcohol: "sin_alcohol",
    con_alcohol: "con_alcohol",
    cervezas: "cervezas",
    vinos: "vinos",
  };
  const sectionToSupplier: Record<BebidaRow["section"], string> = {
    sin_alcohol: "coca-cola",
    con_alcohol: "mosto",
    cervezas: "quilmes",
    vinos: "mosto",
  };

  const productByName: Record<string, { id: string }> = {};
  let created = 0;
  for (const row of bebidas) {
    const containerType = row.name.toUpperCase().includes("TIRADA") ? "KEG" : "BOTTLE";
    const product = await prisma.product.upsert({
      where: { id: `prod-${slug(row.name)}` },
      update: {},
      create: {
        id: `prod-${slug(row.name)}`,
        venueId: venue.id,
        categoryId: categories[sectionToCategory[row.section]].id,
        name: titleCase(row.name),
        unitOfMeasure: "ML",
        containerLabel: row.containerMl ? `${row.containerMl}ml` : containerType === "KEG" ? "30L" : null,
        containerType,
        servingsPerContainer: row.servingsPerContainer || 1,
        costPricePerContainer: row.costPricePerContainer ?? 0,
        salePricePerServing: null, // no sale-price data in source Excel — see data/catalogo-bebidas.md
        isSellable: true,
        isRecipeIngredient: true,
        currentStock: 0, // source sheet's Stock Final was never reconciled (all negative) — real opening count needed
        primarySupplierId: suppliers[sectionToSupplier[row.section]].id,
      },
    });
    productByName[row.name] = product;
    created++;
  }
  console.log(`  ${created} bottle/can/keg products seeded`);

  // ── Quick-grid drinks (Registro diario tap cards, from Pablo's validated mockup) ──
  // Direct 1:1 mappings are unambiguous. Generic categories (Cerveza/Vino/Whisky/
  // Champagne/S・Alcohol) needed a default SKU picked — FLAGGED for Pablo to confirm,
  // see data/catalogo-bebidas.md and 00-brief.md.
  await setQuickGrid("Fernet", "FERNET", { emoji: "🍺", colorHex: "#8B4513", sort: 1 });
  await setQuickGrid("Cerveza", "MILLER 330", { emoji: "🍺", colorHex: "#F5A623", sort: 4 });
  await setQuickGrid("Vino", "SANTA JULIA MALBEC", { emoji: "🍷", colorHex: "#7B2D42", sort: 5 });
  await setQuickGrid("Whisky", "JOHNNY RED", { emoji: "🥃", colorHex: "#D4A017", sort: 6 });
  await setQuickGrid("Champagne", "CHANDON EXTRA BRUT", { emoji: "🥂", colorHex: "#E8C874", sort: 7 });
  await setQuickGrid("S/Alcohol", "AGUA SIN GAS", { emoji: "💧", colorHex: "#4A90D9", sort: 8 });

  async function setQuickGrid(
    displayName: string,
    matchName: string,
    opts: { emoji: string; colorHex: string; sort: number }
  ) {
    const p = productByName[matchName];
    if (!p) {
      console.warn(`  quick-grid mapping skipped, not found: ${matchName}`);
      return;
    }
    await prisma.product.update({
      where: { id: p.id },
      data: {
        showOnQuickGrid: true,
        quickGridSort: opts.sort,
        emoji: opts.emoji,
        colorHex: opts.colorHex,
      },
    });
  }

  // ── Cocktail products with recipes (demonstrates Costeo & Recetas end-to-end) ──
  const ginTonic = await prisma.product.upsert({
    where: { id: "prod-gin-tonic" },
    update: {},
    create: {
      id: "prod-gin-tonic",
      venueId: venue.id,
      categoryId: categories["con_alcohol"].id,
      name: "Gin Tonic",
      unitOfMeasure: "ML",
      servingsPerContainer: 1,
      costPricePerContainer: 0, // computed via Recipe, not a direct bottle
      isSellable: true,
      showOnQuickGrid: true,
      quickGridSort: 2,
      emoji: "🍹",
      colorHex: "#7FB069",
    },
  });
  await prisma.recipe.upsert({
    where: { productId: ginTonic.id },
    update: {},
    create: {
      productId: ginTonic.id,
      yieldServings: 1,
      ingredients: {
        create: [
          { ingredientProductId: productByName["GORDONS"].id, quantity: 1, uom: "ML" },
          { ingredientProductId: productByName["TONICA"].id, quantity: 1, uom: "ML" },
        ],
      },
    },
  });

  const negroni = await prisma.product.upsert({
    where: { id: "prod-negroni" },
    update: {},
    create: {
      id: "prod-negroni",
      venueId: venue.id,
      categoryId: categories["con_alcohol"].id,
      name: "Negroni",
      unitOfMeasure: "ML",
      servingsPerContainer: 1,
      costPricePerContainer: 0,
      isSellable: true,
      showOnQuickGrid: true,
      quickGridSort: 3,
      emoji: "🍊",
      colorHex: "#D2691E",
    },
  });
  await prisma.recipe.upsert({
    where: { productId: negroni.id },
    update: {},
    create: {
      productId: negroni.id,
      yieldServings: 1,
      ingredients: {
        create: [
          { ingredientProductId: productByName["GORDONS"].id, quantity: 1, uom: "ML" },
          { ingredientProductId: productByName["CAMPARI"].id, quantity: 1, uom: "ML" },
          { ingredientProductId: productByName["VERMUTH ROSSO"].id, quantity: 1, uom: "ML" },
        ],
      },
    },
  });

  // ── Owners (Registro diario "Dueños" tab, from mockup sample) ──
  await prisma.person.upsert({
    where: { id: "person-florencia" },
    update: {},
    create: { id: "person-florencia", venueId: venue.id, name: "Florencia", kind: "OWNER" },
  });
  await prisma.person.upsert({
    where: { id: "person-federico" },
    update: {},
    create: { id: "person-federico", venueId: venue.id, name: "Federico", kind: "OWNER" },
  });

  // ── Initial stock period (all counts start at 0 — needs a real opening count) ──
  const period = await prisma.stockPeriod.upsert({
    where: { id: "period-inicial" },
    update: {},
    create: { id: "period-inicial", venueId: venue.id, label: "Período inicial", status: "OPEN" },
  });
  const allProducts = await prisma.product.findMany({ where: { venueId: venue.id } });
  for (const p of allProducts) {
    await prisma.stockCount.upsert({
      where: { stockPeriodId_productId: { stockPeriodId: period.id, productId: p.id } },
      update: {},
      create: { stockPeriodId: period.id, productId: p.id, initialQuantity: 0 },
    });
  }

  // ── Cristalería y Vajilla (from Pablo's real paper control sheet) ──
  const glasswareItems: {
    code: string;
    name: string;
    location: "BARRA" | "DEPOSITO";
    stockBase: number;
  }[] = [
    { code: "BAR-001", name: "Vaso Bristol", location: "BARRA", stockBase: 0 },
    { code: "BAR-002", name: "Vaso Bristol Brindis", location: "BARRA", stockBase: 0 },
    { code: "BAR-003", name: "Vaso Trago Largo", location: "BARRA", stockBase: 0 },
    { code: "BAR-004", name: "Chupinos", location: "BARRA", stockBase: 0 },
    { code: "BAR-005", name: "Jarras", location: "BARRA", stockBase: 0 },
    { code: "BAR-006", name: "Copa de Vino (tintos / blancos / tragos)", location: "BARRA", stockBase: 0 },
    { code: "BAR-007", name: "Copa Gin", location: "BARRA", stockBase: 0 },
    { code: "BAR-008", name: "Copa Gin Blu", location: "BARRA", stockBase: 0 },
    { code: "BAR-009", name: "Copa Carpano", location: "BARRA", stockBase: 0 },
    { code: "BAR-010", name: "Copa Martini", location: "BARRA", stockBase: 0 },
    { code: "BAR-011", name: "Copa Hurricane", location: "BARRA", stockBase: 0 },
    { code: "BAR-012", name: "Copa Champagne", location: "BARRA", stockBase: 0 },
    { code: "BAR-013", name: "Tazas", location: "BARRA", stockBase: 0 },
    { code: "BAR-014", name: "Jarritos", location: "BARRA", stockBase: 0 },
    { code: "BAR-015", name: "Chicos", location: "BARRA", stockBase: 0 },
    { code: "BAR-016", name: "Tetera", location: "BARRA", stockBase: 0 },
    { code: "DEP-001", name: "Copa Carpano", location: "DEPOSITO", stockBase: 6 },
    { code: "DEP-002", name: "Copones de Vino", location: "DEPOSITO", stockBase: 108 },
    { code: "DEP-003", name: "Copas de Champagne", location: "DEPOSITO", stockBase: 132 },
    { code: "DEP-004", name: "Copas de Gin", location: "DEPOSITO", stockBase: 24 },
    { code: "DEP-005", name: "Jarras", location: "DEPOSITO", stockBase: 24 },
    { code: "DEP-006", name: "Copas Old Fashion", location: "DEPOSITO", stockBase: 18 },
    { code: "DEP-007", name: "Jarros", location: "DEPOSITO", stockBase: 6 },
    { code: "DEP-008", name: "Chicos", location: "DEPOSITO", stockBase: 6 },
  ];
  for (const [i, g] of glasswareItems.entries()) {
    await prisma.glasswareItem.upsert({
      where: { id: `glass-${slug(g.code)}` },
      update: {},
      create: {
        id: `glass-${slug(g.code)}`,
        venueId: venue.id,
        code: g.code,
        name: g.name,
        location: g.location,
        stockBase: g.stockBase,
        sortOrder: i,
      },
    });
  }
  console.log(`  ${glasswareItems.length} glassware items seeded (Barra + Depósito)`);

  console.log("Seed complete.");
  console.log(`  Admin login: pablo@lapulpe.local / cambiar123 (CHANGE before real handoff)`);
}

function slug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function titleCase(name: string) {
  return name
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
