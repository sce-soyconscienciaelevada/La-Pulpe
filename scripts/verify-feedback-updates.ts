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

  console.log("== /api/version ==");
  const verRes = await context.request.get(`${BASE}/api/version`);
  const verData = await verRes.json();
  ok("Version endpoint returns a version string", typeof verData.version === "string" && verData.version.length > 0, JSON.stringify(verData));

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", "pablo@lapulpe.local");
  await page.fill("#password", TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });

  console.log("== What's New modal (first visit) ==");
  await page.evaluate(() => window.localStorage.removeItem("barmgmt_seen_version"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const modalVisible = await page.locator("text=Novedades").isVisible().catch(() => false);
  ok("What's New modal shows on first visit", modalVisible);
  if (modalVisible) {
    await page.click('button:has-text("Entendido")');
    await page.waitForTimeout(300);
    const modalGone = !(await page.locator("text=Novedades").isVisible().catch(() => false));
    ok("Modal dismisses after clicking Entendido", modalGone);
    const stored = await page.evaluate(() => window.localStorage.getItem("barmgmt_seen_version"));
    ok("localStorage records the seen version", !!stored, stored ?? "null");
  }

  console.log("== Modal does not reappear on reload ==");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const modalStillGone = !(await page.locator("text=Novedades").isVisible().catch(() => false));
  ok("Modal stays dismissed after reload", modalStillGone);

  console.log("== Feedback screenshot paste ==");
  await page.goto(`${BASE}/feedback`, { waitUntil: "networkidle" });
  await page.fill('input[placeholder="Título breve"]', "QA Screenshot Test");
  const textarea = page.locator('textarea[placeholder*="Contá qué pasó"]');
  await textarea.click();
  await textarea.fill("Testing paste flow");

  // Simulate pasting a real image via a synthetic ClipboardEvent (Playwright
  // can't access the OS clipboard headlessly, so we construct one in-page).
  await page.evaluate(async () => {
    // 2x2 red PNG, tiny fixture
    const b64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFUlEQVR42mNk+M9QzwAEjAyMDIwMAAoKAf4gGmb4AAAAAElFTkSuQmCC";
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const file = new File([bytes], "paste.png", { type: "image/png" });
    const dt = new DataTransfer();
    dt.items.add(file);
    const ta = document.querySelector('textarea[placeholder*="Contá qué pasó"]') as HTMLTextAreaElement;
    const evt = new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true });
    ta.dispatchEvent(evt);
  });
  await page.waitForTimeout(1000);
  const previewVisible = await page.locator('img[alt="Captura pegada"]').isVisible().catch(() => false);
  ok("Screenshot preview appears after simulated paste", previewVisible);

  await page.click('button:has-text("Enviar")');
  await page.waitForTimeout(4000);
  const bodyAfter = await page.textContent("body");
  ok("New feedback item with screenshot appears", !!bodyAfter?.includes("QA Screenshot Test"));
  const attachedImg = await page.locator('img[alt="Captura adjunta"]').first().isVisible().catch(() => false);
  ok("Attached screenshot renders on the feedback card", attachedImg);

  console.log("\nConsole/page errors:", errors.length === 0 ? "none" : errors);
  console.log(`\n${checks - failures}/${checks} checks passed.`);
  await browser.close();
  if (failures > 0 || errors.length > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
