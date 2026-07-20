import { chromium } from "playwright";

const BASE = "https://la-pulpe-three.vercel.app";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", "pablo@lapulpe.local");
  await page.fill("#password", "cambiar123");
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });
  console.log("Login OK, landed on:", page.url());

  const routes = [
    "/", "/inventario", "/registro", "/stock", "/compras", "/productos",
    "/costeo", "/precios", "/proveedores", "/reportes", "/estadisticas", "/ajustes",
  ];
  for (const r of routes) {
    const res = await page.goto(`${BASE}${r}`, { waitUntil: "networkidle" });
    console.log(r, "->", res?.status());
  }

  await page.goto(`${BASE}/stock`, { waitUntil: "networkidle" });
  const productCount = await page.locator("table tbody tr").count();
  console.log("Stock table rows (should be ~90):", productCount);

  const pdfRes = await page.request.get(`${BASE}/api/reportes/rentabilidad`);
  const buf = await pdfRes.body();
  console.log("Rentabilidad PDF:", pdfRes.status(), buf.slice(0, 4).toString());

  console.log("Console/page errors:", errors.length === 0 ? "none" : errors);

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
