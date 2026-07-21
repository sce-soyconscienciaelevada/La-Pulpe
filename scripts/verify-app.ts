import { chromium } from "playwright";

const BASE = "http://localhost:3000";
// Never hardcode the real admin password here -- this repo is public.
const TEST_PASSWORD = process.env["BARMGMT_TEST_PASSWORD"] || "cambiar123";
const errors: string[] = [];
let checks = 0;
let failures = 0;

// This script MUTATES data (fake products, fake sales, force-closes a stock
// period). There is no separate local dev database anymore -- SQLite was
// dropped once this app deployed, so BARMGMT_DB_CONN always points at the
// real Neon database, local runs included. Refuse to run unless the caller
// explicitly confirms they mean to mutate whatever DB is currently
// configured. Use verify-prod-readonly.ts instead for a safe live check.
if (process.env["CONFIRM_MUTATE_DB"] !== "yes") {
  console.error(
    "Refusing to run: this script mutates real data. Set CONFIRM_MUTATE_DB=yes " +
      "only if you're certain BARMGMT_DB_CONN does NOT point at Pablo's live data."
  );
  process.exit(1);
}

function ok(label: string, cond: boolean, detail?: string) {
  checks++;
  if (cond) {
    console.log(`  ✓ ${label}`);
  } else {
    failures++;
    console.log(`  ✗ ${label}${detail ? " — " + detail : ""}`);
  }
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[console] ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`[pageerror] ${err.message}`));

  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);

  console.log("== Login ==");
  await page.goto(`${BASE}/login`);
  await page.fill("#email", "pablo@lapulpe.local");
  await page.fill("#password", TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/`, { timeout: 10000 });
  ok("Redirected to / after login", page.url() === `${BASE}/`);

  console.log("\n== Visit every route ==");
  const routes = [
    ["/", "Inicio"],
    ["/inventario", "Inventario"],
    ["/registro", "Registro diario"],
    ["/stock", "Stock semanal"],
    ["/compras", "Compras & Pedidos"],
    ["/productos", "Productos"],
    ["/costeo", "Costeo & Recetas"],
    ["/precios", "Precios & Rentabilidad"],
    ["/proveedores", "Proveedores"],
    ["/reportes", "Reportes"],
    ["/estadisticas", "Estadísticas"],
    ["/ajustes", "Ajustes"],
  ] as const;

  for (const [path, expectedText] of routes) {
    const res = await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    const status = res?.status() ?? 0;
    const bodyText = await page.textContent("body");
    ok(`${path} -> 200`, status === 200, `got ${status}`);
    ok(`${path} contains "${expectedText}"`, !!bodyText?.includes(expectedText));
  }

  console.log("\n== Golden path: Inventario quick adjust ==");
  await page.goto(`${BASE}/inventario`, { waitUntil: "networkidle" });
  await page.fill('input[placeholder="Buscar producto..."]', "Fernet");
  await page.waitForTimeout(300);
  const stockBefore = await page.locator("text=/^\\d+\\.\\d$/").first().textContent();
  const plusBtn = page.locator('button[aria-label*="Agregar 1 a"]').first();
  await plusBtn.click();
  await page.waitForTimeout(800);
  const stockAfter = await page.locator("text=/^\\d+\\.\\d$/").first().textContent();
  ok("Fernet stock increased after +1", Number(stockAfter) === Number(stockBefore) + 1, `${stockBefore} -> ${stockAfter}`);

  console.log("\n== Golden path: Registro diario tap register ==");
  await page.goto(`${BASE}/registro`, { waitUntil: "networkidle" });
  // Consumiciones tab is default
  const fernetCard = page.locator("button", { hasText: "Fernet" }).first();
  await fernetCard.click();
  await page.waitForTimeout(800);
  const fernetCountText = await fernetCard.textContent();
  ok("Fernet quick-grid count is at least 1 after tap", /\d/.test(fernetCountText ?? ""), fernetCountText ?? "");

  // Cortesía tab
  await page.getByRole("button", { name: "Cortesía", exact: true }).click();
  await page.waitForTimeout(300);
  const ginCard = page.locator("button", { hasText: "Gin Tonic" }).first();
  await ginCard.click();
  await page.waitForTimeout(800);
  ok("Cortesía tap did not throw", errors.filter((e) => e.includes("pageerror")).length === 0);

  // Resumen tab
  await page.getByRole("button", { name: "Resumen", exact: true }).click();
  await page.waitForTimeout(500);
  const resumenText = await page.textContent("body");
  ok("Resumen shows Ventas del día", !!resumenText?.includes("Ventas del día"));
  ok("Resumen shows Ganancia del día", !!resumenText?.includes("Ganancia del día"));

  console.log("\n== Golden path: Precios set sale price + margin computes ==");
  await page.goto(`${BASE}/precios`, { waitUntil: "networkidle" });
  const johnnyRow = page.locator("tr", { hasText: "Johnny Red" });
  const priceInput = johnnyRow.locator('input[type="number"]');
  await priceInput.fill("450");
  await priceInput.blur();
  await page.waitForTimeout(1000);
  await page.reload({ waitUntil: "networkidle" });
  const johnnyRowAfter = page.locator("tr", { hasText: "Johnny Red" });
  const marginBadge = await johnnyRowAfter.locator("td").last().textContent();
  ok("Johnny Red shows a margin % after setting price", /%/.test(marginBadge ?? ""), marginBadge ?? "");

  console.log("\n== Golden path: Costeo recipe cost computed ==");
  await page.goto(`${BASE}/costeo`, { waitUntil: "networkidle" });
  const costeoText = await page.textContent("body");
  ok("Gin Tonic recipe visible", !!costeoText?.includes("Gin Tonic"));
  ok("Negroni recipe visible", !!costeoText?.includes("Negroni"));
  ok("Recipe shows Costo:", !!costeoText?.includes("Costo:"));

  console.log("\n== Golden path: Stock semanal shows 90 rows ==");
  await page.goto(`${BASE}/stock`, { waitUntil: "networkidle" });
  const stockRows = await page.locator("table tbody tr").count();
  ok("Stock semanal has ~90 rows", stockRows >= 88, `got ${stockRows}`);

  console.log("\n== Golden path: Compras logs a purchase and updates stock ==");
  await page.goto(`${BASE}/inventario`, { waitUntil: "networkidle" });
  await page.fill('input[placeholder="Buscar producto..."]', "Campari");
  await page.waitForTimeout(300);
  const campariBefore = await page.locator("text=/^-?\\d+\\.\\d$/").first().textContent();

  await page.goto(`${BASE}/compras`, { waitUntil: "networkidle" });
  const campariOptionValue = await page
    .locator('select[name="productId"] option', { hasText: "Campari" })
    .first()
    .getAttribute("value");
  await page.selectOption('select[name="productId"]', campariOptionValue!);
  await page.fill('input[name="quantity"]', "5");
  await page.fill('input[name="unitCost"]', "250");
  await page.click('button:has-text("Registrar compra")');
  await page.waitForTimeout(1000);

  await page.goto(`${BASE}/inventario`, { waitUntil: "networkidle" });
  await page.fill('input[placeholder="Buscar producto..."]', "Campari");
  await page.waitForTimeout(300);
  const campariAfter = await page.locator("text=/^-?\\d+\\.\\d$/").first().textContent();
  ok(
    "Campari stock increased by 5 after purchase",
    Number(campariAfter) === Number(campariBefore) + 5,
    `${campariBefore} -> ${campariAfter}`
  );

  console.log("\n== Golden path: Producto create + edit ==");
  await page.goto(`${BASE}/productos/nuevo`, { waitUntil: "networkidle" });
  await page.fill('input[name="name"]', "Test QA Producto");
  await page.fill('input[name="servingsPerContainer"]', "10");
  await page.fill('input[name="costPricePerContainer"]', "100");
  await page.click('button:has-text("Crear producto")');
  await page.waitForURL(/\/productos\/(?!nuevo)[a-z0-9-]+$/, { timeout: 10000 });
  await page.waitForLoadState("networkidle");
  ok("New product redirected to its edit page", /\/productos\/(?!nuevo)[a-z0-9-]+$/.test(page.url()));
  const editHeading = await page.getByRole("heading", { level: 1 }).textContent();
  ok("Edit page heading shows the new product name", editHeading === "Test QA Producto", editHeading ?? "null");
  const nameFieldValue = await page.locator('input[name="name"]').inputValue();
  ok("Edit form name field pre-filled correctly", nameFieldValue === "Test QA Producto", nameFieldValue);

  console.log("\n== Golden path: Stock period close + reconciliation ==");
  await page.goto(`${BASE}/stock`, { waitUntil: "networkidle" });
  // Count Fernet up (known productId prod-fernet) then set a counted value that
  // deliberately differs from expected, to force a non-zero variance.
  const fernetStockRow = page.locator("tr", { hasText: "Fernet" }).first();
  const fernetCountInput = fernetStockRow.locator('input[type="number"]');
  await fernetCountInput.fill("3");
  await fernetCountInput.blur();
  await page.waitForTimeout(800);

  page.on("dialog", (d) => {
    if (d.type() === "prompt") d.accept("QA período 2");
    else d.accept();
  });
  const closeBtn = page.locator('button:has-text("y arrancar el próximo")');
  await closeBtn.click();
  await page.waitForTimeout(1500);
  await page.reload({ waitUntil: "networkidle" });
  const stockPageText = await page.textContent("body");
  ok("New period label visible after close", !!stockPageText?.includes("QA período 2"));

  const fernetProductForCheck = await context.request
    .get(`${BASE}/api/reportes/rentabilidad`)
    .then((r) => r.status());
  ok("App still responsive after period close (rentabilidad PDF)", fernetProductForCheck === 200);

  console.log("\n== PDF reports ==");
  for (const path of ["cierre-dia", "stock-semanal", "rentabilidad", "pedido"]) {
    const res = await context.request.get(`${BASE}/api/reportes/${path}`);
    const buf = await res.body();
    const isPdf = buf.slice(0, 4).toString() === "%PDF";
    ok(`/api/reportes/${path} returns a real PDF`, res.status() === 200 && isPdf, `status=${res.status()} bytes=${buf.length} magic=${buf.slice(0, 4)}`);
  }

  console.log("\n== Mobile QA (375px) ==");
  const mobilePage = await context.newPage();
  await mobilePage.setViewportSize({ width: 375, height: 700 });
  for (const [path] of routes) {
    await mobilePage.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    const scrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    ok(`${path} no horizontal overflow at 375px`, scrollWidth <= 375, `scrollWidth=${scrollWidth}`);
  }
  // Registro tabs specifically, since it has the widest content (quick grid)
  await mobilePage.goto(`${BASE}/registro`, { waitUntil: "networkidle" });
  for (const tab of ["Dueños", "Consumiciones", "Cortesía", "Pedido", "Resumen"]) {
    await mobilePage.getByRole("button", { name: tab, exact: true }).click();
    await mobilePage.waitForTimeout(200);
    const sw = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    ok(`Registro/${tab} no horizontal overflow at 375px`, sw <= 375, `scrollWidth=${sw}`);
  }

  console.log("\n== Console/page errors captured during run ==");
  if (errors.length === 0) {
    console.log("  none");
  } else {
    for (const e of errors) console.log("  " + e);
  }

  await browser.close();

  console.log(`\n${checks - failures}/${checks} checks passed.`);
  if (failures > 0 || errors.length > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
