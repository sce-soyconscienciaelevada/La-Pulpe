import { chromium } from "playwright";

const BASE = "http://localhost:3000";
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

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", "pablo@lapulpe.local");
  await page.fill("#password", TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });

  console.log("== Recetario list ==");
  await page.goto(`${BASE}/recetario`, { waitUntil: "networkidle" });
  const listBody = await page.textContent("body");
  ok("Gin Tonic recipe card visible", !!listBody?.includes("Gin Tonic"));
  ok("Negroni recipe card visible", !!listBody?.includes("Negroni"));

  console.log("== Ficha técnica detail + save ==");
  await page.click('a:has-text("Gin Tonic")');
  await page.waitForURL(/\/recetario\/[a-z0-9-]+$/, { timeout: 10000 });

  const photoUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Gin_and_tonic_%286997330715%29.jpg/320px-Gin_and_tonic_%286997330715%29.jpg";
  await page.fill('input[placeholder="https://..."]', photoUrl);
  await page.fill('input[placeholder="Ej: Copa Martini"]', "Vaso Trago Largo");
  await page.fill('input[placeholder="Ej: Twist de naranja"]', "Rodaja de limón + pepino");
  await page.fill('textarea[placeholder*="Historia"]', "Clásico refrescante, el más pedido de la barra.");
  await page.fill('textarea[placeholder*="Enfriar"]', "Llenar el vaso con hielo\nAgregar 1 medida de gin\nCompletar con tónica\nRemover suave");
  await page.click('button:has-text("Guardar")');
  await page.waitForTimeout(4000);

  await page.reload({ waitUntil: "networkidle" });
  const detailBody = await page.textContent("body");
  ok("Glass label persisted after reload", !!detailBody?.includes("Vaso Trago Largo"));
  ok("Garnish persisted after reload", !!detailBody?.includes("Rodaja de limón"));
  ok("Description persisted after reload", !!detailBody?.includes("el más pedido"));
  const imgSrc = await page.locator("img").first().getAttribute("src");
  ok("Photo URL persisted", imgSrc === photoUrl, imgSrc ?? "null");

  console.log("== Recetario list shows updated card ==");
  await page.goto(`${BASE}/recetario`, { waitUntil: "networkidle" });
  const listBody2 = await page.textContent("body");
  ok("List shows updated description snippet", !!listBody2?.includes("el más pedido"));

  console.log("== Printable ficha técnica PDF ==");
  const currentUrl = new URL(page.url());
  await page.goto(`${BASE}/recetario`, { waitUntil: "networkidle" });
  await page.click('a:has-text("Gin Tonic")');
  await page.waitForURL(/\/recetario\/[a-z0-9-]+$/);
  const productId = page.url().split("/recetario/")[1];
  const pdfRes = await context.request.get(`${BASE}/api/reportes/ficha-tecnica?productId=${productId}`);
  const buf = await pdfRes.body();
  ok("Ficha técnica PDF generates with photo", pdfRes.status() === 200 && buf.slice(0, 4).toString() === "%PDF", `status=${pdfRes.status()}`);

  console.log("\nConsole/page errors:", errors.length === 0 ? "none" : errors);
  console.log(`\n${checks - failures}/${checks} checks passed.`);
  await browser.close();
  if (failures > 0 || errors.length > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
