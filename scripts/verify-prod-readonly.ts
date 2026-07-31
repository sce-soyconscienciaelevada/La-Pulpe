import { chromium } from "playwright";
import { join } from "node:path";
import { staticRoutes } from "./routes";

const BASE = "https://la-pulpe-three.vercel.app";
// Never hardcode the real admin password here -- this repo is public.
// Export BARMGMT_TEST_PASSWORD (the current prod password) before running this.
const TEST_PASSWORD = process.env["BARMGMT_TEST_PASSWORD"];

async function main() {
  if (!TEST_PASSWORD) {
    console.error("Set BARMGMT_TEST_PASSWORD to the current prod admin password before running this.");
    process.exit(1);
  }
  const browser = await chromium.launch();
  const page = await browser.newPage();
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
  console.log("Login OK, landed on:", page.url());

  // Derived from the filesystem, not hardcoded: the old hardcoded list here
  // went stale at 14 routes while the app grew to 23, so heladeras,
  // inventario-barra, ventas-pos and recetario were checked by nothing.
  const routes = staticRoutes(join(process.cwd(), "src", "app")).filter((r) => r !== "/login");
  const failures: string[] = [];
  for (const r of routes) {
    const res = await page.goto(`${BASE}${r}`, { waitUntil: "networkidle" });
    const status = res?.status() ?? 0;
    const ok = status === 200;
    if (!ok) failures.push(`${r} -> ${status}`);
    console.log(ok ? "PASS" : "FAIL", r, "->", status);
  }

  await page.goto(`${BASE}/stock`, { waitUntil: "networkidle" });
  const productCount = await page.locator("table tbody tr").count();
  console.log("Stock table rows (should be ~90):", productCount);

  const pdfRes = await page.request.get(`${BASE}/api/reportes/rentabilidad`);
  const buf = await pdfRes.body();
  console.log("Rentabilidad PDF:", pdfRes.status(), buf.slice(0, 4).toString());

  console.log("Console/page errors:", errors.length === 0 ? "none" : errors);

  await browser.close();

  // Previously this script only printed statuses and always exited 0, so a
  // failing route scrolled past unnoticed. It now fails loudly.
  if (failures.length > 0) {
    console.error(`\n${failures.length} route(s) did not return 200:\n  ${failures.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`\nAll ${routes.length} routes returned 200.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
