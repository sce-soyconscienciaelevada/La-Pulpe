import { chromium } from "playwright";

const BASE = "http://localhost:3000";
// Never hardcode the real admin password here -- this repo is public.
// Export BARMGMT_TEST_PASSWORD before running against a DB where it's been rotated.
const TEST_PASSWORD = process.env["BARMGMT_TEST_PASSWORD"] || "cambiar123";
let checks = 0;
let failures = 0;
function ok(label: string, cond: boolean, detail?: string) {
  checks++;
  if (cond) console.log(`  ✓ ${label}`);
  else {
    failures++;
    console.log(`  ✗ ${label}${detail ? " — " + detail : ""}`);
  }
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("dialog", (d) => d.accept());

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", "pablo@lapulpe.local");
  await page.fill("#password", TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });

  console.log("== Cristalería ==");
  await page.goto(`${BASE}/cristaleria`, { waitUntil: "networkidle" });
  const bodyText = await page.textContent("body");
  ok("Page shows Barra section", !!bodyText?.includes("Barra"));
  ok("Page shows Depósito section", !!bodyText?.includes("Depósito"));
  ok("Vaso Bristol (Barra item) visible", !!bodyText?.includes("Vaso Bristol"));
  ok("Copones de Vino (Depósito item) visible", !!bodyText?.includes("Copones de Vino"));

  const rows = await page.locator("table tbody tr").count();
  ok("24 total glassware rows across both tables", rows === 24, `got ${rows}`);

  await page.click('button:has-text("+ Agregar semana")');
  await page.waitForTimeout(4000);
  const bodyText2 = await page.textContent("body");
  ok("Semana 1 column appears after adding a week", !!bodyText2?.includes("Semana 1"));

  // Fill a count for Copa Carpano (Depósito, stockBase=6) -> expect diff = 6 - entered
  const carpanoRow = page.locator("tr", { hasText: "Copa Carpano" }).last();
  const firstCountInput = carpanoRow.locator('input[type="number"]').first();
  await firstCountInput.fill("4");
  await firstCountInput.blur();
  await page.waitForTimeout(4000);
  await page.reload({ waitUntil: "networkidle" });
  const carpanoRowAfter = page.locator("tr", { hasText: "Copa Carpano" }).last();
  const diffBadge = await carpanoRowAfter.locator("td").nth(-2).textContent();
  ok("Diferencia computed (6 - 4 = 2) for Depósito Copa Carpano", (diffBadge ?? "").includes("2"), diffBadge ?? "");

  const pdfRes = await context.request.get(`${BASE}/api/reportes/cristaleria`);
  const pdfBuf = await pdfRes.body();
  ok("Cristalería PDF generates", pdfRes.status() === 200 && pdfBuf.slice(0, 4).toString() === "%PDF");

  console.log("== Feedback ==");
  await page.goto(`${BASE}/feedback`, { waitUntil: "networkidle" });
  await page.fill('input[placeholder="Título breve"]', "QA Test Feedback Item");
  await page.fill('textarea[placeholder*="Contá qué pasó"]', "This is a QA test description for verification.");
  await page.click('button:has-text("Enviar")');
  await page.waitForTimeout(4000);
  const fbBody = await page.textContent("body");
  ok("New feedback item appears", !!fbBody?.includes("QA Test Feedback Item"));
  ok("New item shows NEW status", !!fbBody?.includes("Nuevo"));

  const fbCard = page.locator("div", { hasText: "QA Test Feedback Item" }).first();
  const statusSelect = fbCard.locator("select").last();
  await statusSelect.selectOption("IN_PROGRESS");
  await page.waitForTimeout(4000);
  const fbBody2 = await page.textContent("body");
  ok("Status updates to En progreso", !!fbBody2?.includes("En progreso"));

  console.log("\nConsole/page errors:", errors.length === 0 ? "none" : errors);
  console.log(`\n${checks - failures}/${checks} checks passed.`);
  await browser.close();
  if (failures > 0 || errors.length > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
