import { chromium } from "playwright";
import { prisma } from "../src/lib/prisma";

const BASE = "http://localhost:3000";
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
  const page = await browser.newPage();
  page.on("dialog", (d) => d.accept());

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", "pablo@lapulpe.local");
  await page.fill("#password", "DzTeCN7jl5y5Sp9-");
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });

  await page.goto(`${BASE}/inventario`, { waitUntil: "networkidle" });
  await page.click('button:has-text("+ Agregar producto")');
  await page.fill('input[placeholder="Nombre"]', "QA Verify Item 3");
  await page.fill('input[placeholder="Costo por envase ($)"]', "50");
  await page.click('button:has-text("Crear producto")');
  await page.waitForTimeout(4000);

  // No manual reload this time -- router.refresh() should have handled it.
  const bodyText1 = await page.textContent("body");
  ok("New product visible WITHOUT manual reload", !!bodyText1?.includes("QA Verify Item 3"));

  await page.fill('input[placeholder="Buscar producto..."]', "QA Verify Item 3");
  await page.waitForTimeout(500);
  const delBtn = page.locator(`button[aria-label="Eliminar QA Verify Item 3"]`);
  await delBtn.click();
  await page.waitForTimeout(4000);

  const bodyText2 = await page.textContent("body");
  ok("Product gone WITHOUT manual reload after delete", !bodyText2?.includes("QA Verify Item 3"));

  const dbRow = await prisma.product.findFirst({ where: { name: "QA Verify Item 3" } });
  ok("Product confirmed gone from DB too", dbRow === null);

  await browser.close();
  console.log(`\n${checks - failures}/${checks} checks passed.`);
  await prisma.$disconnect();
  if (failures > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
