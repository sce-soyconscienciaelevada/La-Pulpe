// DEMO seed logic — fake data only, safe to show to outsiders/collaborators.
// Wipes and rebuilds the single demo Venue ("Bar Deriva", fictional — never
// "La Pulpe") so this can run both as a one-time setup (prisma/seed.demo.ts
// CLI) and as a nightly reseed (POST /api/demo/reseed).
//
// This app is single-tenant by design (one Venue per deploy) — unlike
// Micelo's multi-org schema, "demo" here means the whole dedicated demo DB
// has exactly one Venue, so a full TRUNCATE is always safe.
//
// realDataStartedAt is set 90 days in the past (not left null) so the Inicio
// dashboard renders real computed figures from the seeded history instead of
// the app's built-in static "(ejemplo)" placeholder — see src/lib/demo-data.ts
// and src/app/(dashboard)/page.tsx's `isDemo` branch.
//
// Hard guard: refuses to run unless BARMGMT_DEMO=true is set on the target
// deploy's env — this must never be pointed at the real La Pulpe DB.
import { faker } from "@faker-js/faker/locale/es";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type {
  CategoryKind,
  ConsumptionType,
  ReorderStatus,
  StockAdjustmentReason,
  GlasswareLocation,
  FeedbackType,
  FeedbackStatus,
} from "@/generated/prisma/enums";

const VENUE_ID = "venue-bar-deriva-demo";
const DAYS_OF_HISTORY = 90;

function money(min: number, max: number) {
  return Number(faker.finance.amount({ min, max, dec: 0 }));
}

export async function seedDemo(): Promise<{ venueId: string }> {
  if (process.env["BARMGMT_DEMO"] !== "true") {
    throw new Error(
      "Refusing to run: BARMGMT_DEMO env var is not 'true'. This wipes the whole venue's data — only run it against the dedicated demo database."
    );
  }

  faker.seed(7); // reproducible run-to-run — stable screenshots/QA
  const today = new Date();
  today.setHours(12, 0, 0, 0); // noon local, avoids date-boundary flakiness
  const daysAgo = (n: number) => new Date(today.getTime() - n * 86400000);

  console.log("Wiping previous demo data (if any)...");
  const prev = await prisma.venue.findUnique({ where: { id: VENUE_ID } });
  if (prev) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Venue" CASCADE`);
  }

  console.log("Seeding DEMO venue: Bar Deriva (fake bar, fake data)...");

  const venue = await prisma.venue.create({
    data: { id: VENUE_ID, name: "Bar Deriva", currency: "ARS", realDataStartedAt: daysAgo(DAYS_OF_HISTORY) },
  });

  const passwordHash = await bcrypt.hash("demo1234", 10);
  await prisma.user.create({ data: { venueId: venue.id, email: "demo@barderiva.local", passwordHash, role: "OWNER" } });
  await prisma.user.create({ data: { venueId: venue.id, email: "staff@barderiva.local", passwordHash, role: "STAFF" } });

  // ── People ──────────────────────────────────────────────
  const owners = await Promise.all(
    ["Lucía", "Martín"].map((name) => prisma.person.create({ data: { venueId: venue.id, name, kind: "OWNER" } }))
  );
  const staffPeople = await Promise.all(
    ["Sofía", "Nico", "Caro"].map((name) => prisma.person.create({ data: { venueId: venue.id, name, kind: "STAFF" } }))
  );
  const bandPeople = await Promise.all(
    ["Los Foráneos"].map((name) => prisma.person.create({ data: { venueId: venue.id, name, kind: "BAND" } }))
  );

  // ── Categories ─────────────────────────────────────────────
  const catDefs = [
    { key: "sin_alcohol", name: "Bebidas sin alcohol", kind: "BEVERAGE" },
    { key: "con_alcohol", name: "Bebidas con alcohol", kind: "BEVERAGE" },
    { key: "cervezas", name: "Cervezas", kind: "BEVERAGE" },
    { key: "vinos", name: "Vinos y Espumantes", kind: "WINE" },
    { key: "cristaleria", name: "Cristalería", kind: "GLASSWARE" },
    { key: "cafe", name: "Café", kind: "COFFEE" },
    { key: "descartables", name: "Descartables", kind: "DISPOSABLE" },
    { key: "frutas", name: "Frutas y Extras", kind: "INGREDIENT" },
  ] as const;
  const categories: Record<string, { id: string }> = {};
  for (const [i, c] of catDefs.entries()) {
    categories[c.key] = await prisma.category.create({
      data: { venueId: venue.id, name: c.name, kind: c.kind as CategoryKind, sortOrder: i },
    });
  }

  // ── Suppliers ──────────────────────────────────────────────
  const supplierDefs = [
    { key: "cerveceria", name: "Cervecería del Puerto", cats: ["cervezas"] },
    { key: "distribuidora", name: "Distribuidora Rioplatense", cats: ["sin_alcohol"] },
    { key: "vinoteca", name: "Vinoteca Andina", cats: ["con_alcohol", "vinos"] },
    { key: "verduleria", name: "Verdulería del Barrio", cats: ["frutas", "descartables"] },
  ];
  const suppliers: Record<string, { id: string }> = {};
  for (const s of supplierDefs) {
    suppliers[s.key] = await prisma.supplier.create({
      data: { venueId: venue.id, name: s.name, contactPhone: faker.phone.number(), categories: { connect: s.cats.map((k) => ({ id: categories[k].id })) } },
    });
  }

  // ── Products ───────────────────────────────────────────────
  const productDefs = [
    { name: "Agua Sin Gas", cat: "sin_alcohol", type: "BOTTLE", ml: 500, cost: [700, 1000], price: [1800, 2200] },
    { name: "Agua Con Gas", cat: "sin_alcohol", type: "BOTTLE", ml: 500, cost: [700, 1000], price: [1800, 2200] },
    { name: "Coca Cola", cat: "sin_alcohol", type: "BOTTLE", ml: 350, cost: [900, 1200], price: [2200, 2800] },
    { name: "Sprite", cat: "sin_alcohol", type: "BOTTLE", ml: 350, cost: [900, 1200], price: [2200, 2800] },
    { name: "Tónica", cat: "sin_alcohol", type: "BOTTLE", ml: 250, cost: [800, 1100], price: [2000, 2600] },
    { name: "Miller 330", cat: "cervezas", type: "BOTTLE", ml: 330, cost: [1200, 1600], price: [2800, 3400] },
    { name: "Quilmes 1L", cat: "cervezas", type: "BOTTLE", ml: 1000, cost: [2800, 3400], price: [6000, 7200] },
    { name: "Cerveza Tirada", cat: "cervezas", type: "KEG", ml: 30000, cost: [65000, 85000], price: [2200, 2800] },
    { name: "Santa Julia Malbec", cat: "vinos", type: "BOTTLE", ml: 750, cost: [6500, 8500], price: [16000, 20000] },
    { name: "Chandon Extra Brut", cat: "vinos", type: "BOTTLE", ml: 750, cost: [9500, 12000], price: [22000, 27000] },
    { name: "Rutini Chardonnay", cat: "vinos", type: "BOTTLE", ml: 750, cost: [8000, 10500], price: [19000, 24000] },
    { name: "Gordons", cat: "con_alcohol", type: "BOTTLE", ml: 750, cost: [9000, 12000], price: [0, 0] },
    { name: "Campari", cat: "con_alcohol", type: "BOTTLE", ml: 750, cost: [8500, 11000], price: [0, 0] },
    { name: "Vermuth Rosso", cat: "con_alcohol", type: "BOTTLE", ml: 750, cost: [6000, 8000], price: [0, 0] },
    { name: "Fernet", cat: "con_alcohol", type: "BOTTLE", ml: 750, cost: [7500, 9500], price: [3200, 3800] },
    { name: "Johnny Red", cat: "con_alcohol", type: "BOTTLE", ml: 750, cost: [11000, 14000], price: [3800, 4600] },
    { name: "Absolut Vodka", cat: "con_alcohol", type: "BOTTLE", ml: 750, cost: [10000, 13000], price: [3600, 4400] },
    { name: "Jose Cuervo Tequila", cat: "con_alcohol", type: "BOTTLE", ml: 750, cost: [12000, 15000], price: [4000, 4800] },
    { name: "Havana Club 3 Años", cat: "con_alcohol", type: "BOTTLE", ml: 750, cost: [9500, 12500], price: [3600, 4200] },
    { name: "Cointreau", cat: "con_alcohol", type: "BOTTLE", ml: 700, cost: [11500, 14500], price: [0, 0] },
    { name: "Espresso", cat: "cafe", type: "UNIT", ml: null, cost: [300, 500], price: [1800, 2200] },
    { name: "Capuchino", cat: "cafe", type: "UNIT", ml: null, cost: [400, 700], price: [2400, 2900] },
    { name: "Limón", cat: "frutas", type: "UNIT", ml: null, cost: [80, 150], price: [0, 0] },
    { name: "Menta", cat: "frutas", type: "UNIT", ml: null, cost: [50, 100], price: [0, 0] },
    { name: "Servilletas", cat: "descartables", type: "UNIT", ml: null, cost: [20, 40], price: [0, 0] },
    { name: "Sorbetes", cat: "descartables", type: "UNIT", ml: null, cost: [10, 20], price: [0, 0] },
  ] as const;

  const productByName: Record<string, { id: string; costPricePerContainer: number; salePricePerServing: number | null }> = {};
  const products: Awaited<ReturnType<typeof prisma.product.create>>[] = [];
  let quickSort = 1;
  for (const p of productDefs) {
    const cost = money(p.cost[0], p.cost[1]);
    const sale = p.price[0] === 0 ? null : money(p.price[0], p.price[1]);
    const showOnQuickGrid = ["Fernet", "Miller 330", "Santa Julia Malbec", "Johnny Red", "Chandon Extra Brut", "Agua Sin Gas"].includes(p.name);
    const product = await prisma.product.create({
      data: {
        venueId: venue.id,
        categoryId: categories[p.cat].id,
        name: p.name,
        unitOfMeasure: "ML",
        containerLabel: p.ml ? `${p.ml}ml` : null,
        containerType: p.type,
        servingsPerContainer: p.type === "KEG" ? 100 : p.type === "UNIT" ? 1 : Math.max(1, Math.round((p.ml ?? 40) / 40)),
        costPricePerContainer: cost,
        salePricePerServing: sale,
        isSellable: sale !== null || p.cat !== "con_alcohol",
        isRecipeIngredient: p.cat === "con_alcohol",
        currentStock: faker.number.int({ min: 3, max: 60 }),
        reorderThreshold: faker.number.int({ min: 2, max: 8 }),
        primarySupplierId: p.cat === "cervezas" ? suppliers["cerveceria"].id : p.cat === "vinos" || p.cat === "con_alcohol" ? suppliers["vinoteca"].id : p.cat === "sin_alcohol" ? suppliers["distribuidora"].id : suppliers["verduleria"].id,
        showOnQuickGrid,
        quickGridSort: showOnQuickGrid ? quickSort++ : null,
        emoji: p.cat === "cervezas" ? "🍺" : p.cat === "vinos" ? "🍷" : p.cat === "cafe" ? "☕" : p.cat === "con_alcohol" ? "🥃" : undefined,
      },
    });
    productByName[p.name] = { id: product.id, costPricePerContainer: cost, salePricePerServing: sale };
    products.push(product);
  }

  // Cocktails with recipes
  const ginTonic = await prisma.product.create({
    data: { venueId: venue.id, categoryId: categories["con_alcohol"].id, name: "Gin Tonic", unitOfMeasure: "ML", servingsPerContainer: 1, costPricePerContainer: 0, salePricePerServing: money(4000, 4800), isSellable: true, showOnQuickGrid: true, quickGridSort: quickSort++, emoji: "🍹" },
  });
  await prisma.recipe.create({ data: { productId: ginTonic.id, yieldServings: 1, ingredients: { create: [{ ingredientProductId: productByName["Gordons"].id, quantity: 50, uom: "ML" }, { ingredientProductId: productByName["Tónica"].id, quantity: 150, uom: "ML" }] } } });

  const negroni = await prisma.product.create({
    data: { venueId: venue.id, categoryId: categories["con_alcohol"].id, name: "Negroni", unitOfMeasure: "ML", servingsPerContainer: 1, costPricePerContainer: 0, salePricePerServing: money(4200, 5000), isSellable: true, showOnQuickGrid: true, quickGridSort: quickSort++, emoji: "🍊" },
  });
  await prisma.recipe.create({ data: { productId: negroni.id, yieldServings: 1, ingredients: { create: [{ ingredientProductId: productByName["Gordons"].id, quantity: 30, uom: "ML" }, { ingredientProductId: productByName["Campari"].id, quantity: 30, uom: "ML" }, { ingredientProductId: productByName["Vermuth Rosso"].id, quantity: 30, uom: "ML" }] } } });
  productByName["Gin Tonic"] = { id: ginTonic.id, costPricePerContainer: 0, salePricePerServing: null };
  productByName["Negroni"] = { id: negroni.id, costPricePerContainer: 0, salePricePerServing: null };
  const sellablePool = productDefs.filter((p) => p.price[0] !== 0).map((p) => productByName[p.name].id).concat([ginTonic.id, negroni.id]);

  // ── Daily register: BusinessDay + Consumption ────────────
  const consumptionTypes: ConsumptionType[] = ["SALE", "SALE", "SALE", "SALE", "SALE", "SALE", "OWNER", "COMP", "BAND_ALLOWANCE"];
  for (let d = DAYS_OF_HISTORY; d >= 0; d--) {
    const date = daysAgo(d);
    date.setHours(0, 0, 0, 0);
    const isToday = d === 0;
    const businessDay = await prisma.businessDay.create({
      data: { venueId: venue.id, date, status: isToday ? "OPEN" : "CLOSED", openedAt: date, closedAt: isToday ? null : new Date(date.getTime() + 6 * 3600000) },
    });
    const weekday = date.getDay();
    const isWeekend = weekday === 5 || weekday === 6;
    const count = faker.number.int({ min: isWeekend ? 8 : 3, max: isWeekend ? 20 : 10 });
    for (let i = 0; i < count; i++) {
      const type = faker.helpers.arrayElement(consumptionTypes);
      const productId = faker.helpers.arrayElement(sellablePool);
      const productData = Object.values(productByName).find((p) => p.id === productId)!;
      const person = type === "OWNER" ? faker.helpers.arrayElement(owners) : type === "BAND_ALLOWANCE" ? faker.helpers.arrayElement(bandPeople) : faker.datatype.boolean({ probability: 0.3 }) ? faker.helpers.arrayElement(staffPeople) : null;
      const unitPriceCharged = type === "SALE" ? productData.salePricePerServing ?? money(2000, 4000) : 0;
      const unitCost = Math.round((productData.costPricePerContainer || money(300, 2000)) / 8);
      await prisma.consumption.create({
        data: { venueId: venue.id, businessDayId: businessDay.id, productId, type, quantity: 1, personId: person?.id, unitPriceCharged, unitCost, createdAt: new Date(date.getTime() + faker.number.int({ min: 12, max: 23 }) * 3600000) },
      });
    }
  }

  // ── Reorder / purchases / adjustments ────────────────────
  const reorderStatuses: ReorderStatus[] = ["PENDIENTE", "PEDIDO", "RECIBIDO"];
  for (let i = 0; i < 15; i++) {
    const product = faker.helpers.arrayElement(products);
    await prisma.reorderItem.create({
      data: { venueId: venue.id, name: product.name, quantity: faker.number.int({ min: 1, max: 12 }), status: faker.helpers.arrayElement(reorderStatuses), supplierId: product.primarySupplierId, createdAt: daysAgo(faker.number.int({ min: 0, max: 20 })) },
    });
  }

  const stockAdjustmentReasons: StockAdjustmentReason[] = ["BREAKAGE", "WASTE", "RECOUNT_CORRECTION", "OTHER"];
  for (let i = 0; i < 12; i++) {
    const product = faker.helpers.arrayElement(products);
    await prisma.stockAdjustment.create({
      data: { venueId: venue.id, productId: product.id, quantityDelta: -faker.number.int({ min: 1, max: 4 }), reason: faker.helpers.arrayElement(stockAdjustmentReasons), note: faker.lorem.sentence(), createdAt: daysAgo(faker.number.int({ min: 0, max: DAYS_OF_HISTORY })) },
    });
  }

  // ── Stock periods + counts ────────────────────────────────
  const periodLabels = ["Período 1 (cerrado)", "Período 2 (cerrado)", "Período actual"];
  let lastPeriodId = "";
  for (const [i, label] of periodLabels.entries()) {
    const isLast = i === periodLabels.length - 1;
    const period = await prisma.stockPeriod.create({
      data: { venueId: venue.id, label, status: isLast ? "OPEN" : "CLOSED", startDate: daysAgo(DAYS_OF_HISTORY - i * 30), endDate: isLast ? null : daysAgo(DAYS_OF_HISTORY - (i + 1) * 30), closedAt: isLast ? null : daysAgo(DAYS_OF_HISTORY - (i + 1) * 30) },
    });
    lastPeriodId = period.id;
    for (const product of products) {
      const initial = faker.number.int({ min: 5, max: 60 });
      const expected = Math.max(0, initial - faker.number.int({ min: 0, max: 20 }));
      const counted = isLast ? null : expected + faker.number.int({ min: -3, max: 3 });
      await prisma.stockCount.create({
        data: { stockPeriodId: period.id, productId: product.id, initialQuantity: initial, expectedFinalQuantity: expected, countedFinalQuantity: counted, variance: counted !== null ? counted - expected : null },
      });
    }
    for (let i2 = 0; i2 < 15; i2++) {
      const product = faker.helpers.arrayElement(products);
      await prisma.purchase.create({
        data: { venueId: venue.id, stockPeriodId: period.id, productId: product.id, supplierId: product.primarySupplierId, quantity: faker.number.int({ min: 3, max: 20 }), unitCost: productByName[product.name]?.costPricePerContainer || money(500, 3000), purchaseDate: daysAgo(faker.number.int({ min: DAYS_OF_HISTORY - (i + 1) * 30, max: DAYS_OF_HISTORY - i * 30 })) },
      });
    }
  }
  void lastPeriodId;

  // ── Cristalería y Vajilla ─────────────────────────────────
  const glasswareDefs: { code: string; name: string; location: GlasswareLocation; base: number }[] = [
    { code: "BAR-001", name: "Vaso Bristol", location: "BARRA", base: 24 },
    { code: "BAR-002", name: "Vaso Trago Largo", location: "BARRA", base: 18 },
    { code: "BAR-003", name: "Copa de Vino", location: "BARRA", base: 30 },
    { code: "BAR-004", name: "Copa Gin", location: "BARRA", base: 12 },
    { code: "BAR-005", name: "Copa Martini", location: "BARRA", base: 10 },
    { code: "BAR-006", name: "Copa Champagne", location: "BARRA", base: 16 },
    { code: "DEP-001", name: "Copones de Vino", location: "DEPOSITO", base: 96 },
    { code: "DEP-002", name: "Copas de Champagne", location: "DEPOSITO", base: 120 },
    { code: "DEP-003", name: "Copas de Gin", location: "DEPOSITO", base: 24 },
    { code: "DEP-004", name: "Jarras", location: "DEPOSITO", base: 20 },
    { code: "DEP-005", name: "Copas Old Fashion", location: "DEPOSITO", base: 16 },
    { code: "DEP-006", name: "Jarros", location: "DEPOSITO", base: 6 },
  ];
  const glasswareItems = [];
  for (const [i, g] of glasswareDefs.entries()) {
    glasswareItems.push(
      await prisma.glasswareItem.create({ data: { venueId: venue.id, code: g.code, name: g.name, location: g.location, stockBase: g.base, sortOrder: i } })
    );
  }
  for (let m = 1; m >= 0; m--) {
    const isCurrent = m === 0;
    const monthPeriod = await prisma.glasswareMonthPeriod.create({
      data: { venueId: venue.id, label: isCurrent ? "Mes actual" : "Mes anterior", status: isCurrent ? "OPEN" : "CLOSED", startDate: daysAgo(30 * (m + 1)), closedAt: isCurrent ? null : daysAgo(30 * m) },
    });
    for (let w = 1; w <= 4; w++) {
      const week = await prisma.glasswareWeekEntry.create({ data: { monthPeriodId: monthPeriod.id, weekNumber: w, label: `Semana ${w}`, createdAt: daysAgo(30 * (m + 1) - w * 7) } });
      for (const item of glasswareItems) {
        await prisma.glasswareCount.create({ data: { weekEntryId: week.id, itemId: item.id, countedQuantity: Math.max(0, item.stockBase + faker.number.int({ min: -4, max: 2 })) } });
      }
    }
  }

  // ── Feedback ───────────────────────────────────────────────
  const feedbackTypes: FeedbackType[] = ["BUG", "FEATURE_REQUEST", "WORKAROUND"];
  const feedbackStatuses: FeedbackStatus[] = ["NEW", "IN_PROGRESS", "DONE"];
  const feedbackDefs = [
    { title: "Agregar filtro por proveedor en compras", type: "FEATURE_REQUEST" as FeedbackType, status: "NEW" as FeedbackStatus },
    { title: "El conteo de cristalería no guarda la última semana", type: "BUG" as FeedbackType, status: "DONE" as FeedbackStatus },
    { title: "Duplicar período de stock anterior", type: "FEATURE_REQUEST" as FeedbackType, status: "IN_PROGRESS" as FeedbackStatus },
  ];
  for (const f of feedbackDefs) {
    await prisma.feedbackItem.create({
      data: { venueId: venue.id, type: f.type, title: f.title, description: faker.lorem.sentence(), status: f.status, submittedBy: "demo@barderiva.local", resolutionNote: f.status === "DONE" ? "Corregido en el último deploy." : null },
    });
  }
  void feedbackTypes;
  void feedbackStatuses;

  // ── Inventario de Barra (puntos) ──────────────────────────
  const pointProducts = productDefs.filter((p) => p.cat === "con_alcohol" && p.price[0] === 0).map((p) => productByName[p.name].id);
  const recentDays = await prisma.businessDay.findMany({ where: { venueId: venue.id }, orderBy: { date: "desc" }, take: 14 });
  for (const day of recentDays) {
    for (const productId of pointProducts) {
      const initial = faker.number.int({ min: 20, max: 90 });
      const venta = faker.number.int({ min: 0, max: 15 });
      await prisma.barInventoryEntry.create({
        data: { venueId: venue.id, businessDayId: day.id, productId, initialQuantity: initial, entradas: faker.datatype.boolean({ probability: 0.2 }) ? faker.number.int({ min: 10, max: 40 }) : 0, ventaPunto: venta, countedPhysical: initial - venta + faker.number.int({ min: -2, max: 1 }) },
      });
    }
  }

  // ── Control Temperatura Heladeras ────────────────────────
  const fridgeUnits = [];
  for (const [i, name] of ["Heladera Barra", "Heladera Cerveza", "Freezer Depósito", "Heladera Vinos"].entries()) {
    fridgeUnits.push(await prisma.fridgeUnit.create({ data: { venueId: venue.id, code: `H${i + 1}`, name, sortOrder: i } }));
  }
  for (let d = 60; d >= 0; d--) {
    const date = daysAgo(d);
    date.setHours(0, 0, 0, 0);
    for (const unit of fridgeUnits) {
      const tempC = faker.number.float({ min: 1, max: 6, fractionDigits: 1 });
      await prisma.fridgeTempEntry.create({ data: { unitId: unit.id, date, tempC } });
    }
  }
  for (let i = 0; i < 3; i++) {
    const unit = faker.helpers.arrayElement(fridgeUnits);
    await prisma.fridgeIncident.create({
      data: { unitId: unit.id, date: daysAgo(faker.number.int({ min: 0, max: 40 })), tempRecorded: faker.number.float({ min: 8, max: 14, fractionDigits: 1 }), actionTaken: "Se ajustó el termostato y se movió la mercadería sensible a otra unidad.", responsiblePersonId: faker.helpers.arrayElement(staffPeople).id },
    });
  }

  // ── Ventas POS ─────────────────────────────────────────────
  // totalUnidades/totalTicket are the "esperado" (expected, as printed on
  // the POS ticket) side of a reconciliation check against "cargado" (sum
  // of the actual line rows) — they must be generated FROM the line data,
  // not independently, or the UI correctly (and permanently) flags every
  // single period/category as mismatched.
  const posCategoryNames = ["Cervezas", "Tragos", "Vinos", "Sin Alcohol"];
  for (let i = 3; i >= 0; i--) {
    const startAt = daysAgo((i + 1) * 7);
    const endAt = daysAgo(i * 7);

    const categoryPlans = posCategoryNames.map((catName) => {
      const lineCount = faker.number.int({ min: 3, max: 6 });
      const lines = Array.from({ length: lineCount }, () => {
        const product = faker.helpers.arrayElement(products);
        return {
          posCode: faker.string.numeric(3),
          descripcion: product.name,
          unidadesVendidas: faker.number.int({ min: 5, max: 80 }),
          productId: faker.datatype.boolean({ probability: 0.8 }) ? product.id : null,
        };
      });
      return { catName, lines, total: lines.reduce((s, l) => s + l.unidadesVendidas, 0) };
    });
    const periodTotal = categoryPlans.reduce((s, c) => s + c.total, 0);

    const period = await prisma.posSalesPeriod.create({
      data: { venueId: venue.id, label: `Período POS semana ${4 - i}`, startAt, endAt, status: i === 0 ? "OPEN" : "CLOSED", totalUnidades: periodTotal, closedAt: i === 0 ? null : endAt },
    });
    for (const [ci, plan] of categoryPlans.entries()) {
      const category = await prisma.posSalesCategory.create({ data: { periodId: period.id, name: plan.catName, totalTicket: plan.total, sortOrder: ci } });
      for (const line of plan.lines) {
        await prisma.posSalesLine.create({ data: { categoryId: category.id, ...line } });
      }
    }
  }

  console.log(`Demo seed OK — venue "${venue.name}" (${venue.id}).`);
  console.log(`Login: demo@barderiva.local / demo1234 (owner), staff@barderiva.local / demo1234 (staff)`);

  return { venueId: venue.id };
}
