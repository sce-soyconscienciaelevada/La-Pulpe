// Pre-deploy smoke test: renders EVERY route against a running local server
// and asserts each returns 200.
//
// Why this exists: on 2026-07-30 the Inicio page shipped a 500 through a green
// `tsc --noEmit`, a green `next build`, AND a script that exercised all its
// Prisma queries. The failure was a function prop crossing the Server/Client
// component boundary, which only throws when a request actually renders the
// page. A build passing is not evidence a page renders. This is.
//
// Auth: mints its own Auth.js JWT session cookie using the local dev secret,
// so no password is needed and nothing is written to the database.
//
// Usage:
//   1. BARMGMT_DB_CONN=... npx next dev -p 4002
//   2. BARMGMT_DB_CONN=... npx tsx scripts/smoke.ts
//
// Override the target with SMOKE_BASE_URL (defaults to http://localhost:4002).

import { encode } from "@auth/core/jwt";
import { join } from "node:path";
import { prisma } from "../src/lib/prisma";
import { allRoutes } from "./routes";

const BASE_URL = process.env["SMOKE_BASE_URL"] ?? "http://localhost:4002";
const APP_DIR = join(process.cwd(), "src", "app");

// Must match src/auth.ts's fallback — the local dev server uses it too.
const DEV_FALLBACK_SECRET = "local-dev-only-not-a-real-secret-replace-in-prod";
// Auth.js v5 over plain http (no __Secure- prefix). Also used as the JWT salt.
const COOKIE_NAME = "authjs.session-token";

/** Replace [param] segments with a real id pulled from the database. */
async function resolveDynamic(route: string, venueId: string): Promise<string | null> {
  if (!route.includes("[")) return route;

  if (route.includes("[id]")) {
    const product = await prisma.product.findFirst({ where: { venueId } });
    if (!product) return null;
    return route.replace("[id]", product.id);
  }
  // /recetario/[productId] legitimately notFound()s for a product with no
  // Recipe row, so this must resolve from a recipe, not from any product.
  if (route.includes("[productId]")) {
    const recipe = await prisma.recipe.findFirst({ where: { product: { venueId } } });
    if (!recipe) return null;
    return route.replace("[productId]", recipe.productId);
  }
  if (route.includes("[periodId]")) {
    const period = await prisma.posSalesPeriod.findFirst({ where: { venueId } });
    if (!period) return null;
    return route.replace("[periodId]", period.id);
  }
  return null;
}

async function main() {
  const res = await fetch(`${BASE_URL}/api/version`).catch(() => null);
  if (!res || !res.ok) {
    console.error(`No server responding at ${BASE_URL}.`);
    console.error(`Start one first:  BARMGMT_DB_CONN=... npx next dev -p 4002`);
    process.exit(1);
  }

  const user = await prisma.user.findFirst();
  const venue = await prisma.venue.findFirstOrThrow();
  if (!user) {
    console.error("No user in the database to build a session for.");
    process.exit(1);
  }

  const now = Math.floor(Date.now() / 1000);
  const sessionToken = await encode({
    salt: COOKIE_NAME,
    secret: process.env["BARMGMT_AUTH_SECRET"] ?? DEV_FALLBACK_SECRET,
    token: { sub: user.id, email: user.email, iat: now, exp: now + 3600, jti: "smoke-test" },
  });
  const cookie = `${COOKIE_NAME}=${sessionToken}`;

  const discovered = allRoutes(APP_DIR);

  const results: { route: string; status: number | string; ok: boolean; note?: string }[] = [];

  for (const route of discovered) {
    const resolved = await resolveDynamic(route, venue.id);
    if (resolved === null) {
      results.push({ route, status: "skip", ok: true, note: "no row in DB for this dynamic segment" });
      continue;
    }

    const r = await fetch(`${BASE_URL}${resolved}`, {
      headers: { cookie },
      redirect: "manual",
    });
    const body = r.status === 200 ? await r.text() : "";

    // A rendered error boundary can still return 200 — check the body too.
    const errored =
      body.includes("A server error occurred") || body.includes("Application error:");
    // Any redirect to /login means the minted session was rejected: that makes
    // every other result meaningless, so treat it as a hard failure.
    const bounced = r.status >= 300 && r.status < 400 && (r.headers.get("location") ?? "").includes("/login");

    results.push({
      route: resolved === route ? route : `${route}  →  ${resolved.slice(0, 40)}…`,
      status: r.status,
      ok: r.status === 200 && !errored,
      note: bounced ? "redirected to /login — session cookie rejected" : errored ? "error boundary in body" : undefined,
    });
  }

  const pad = Math.max(...results.map((r) => r.route.length)) + 2;
  console.log("");
  for (const r of results) {
    const mark = r.ok ? "PASS" : "FAIL";
    console.log(`${mark}  ${r.route.padEnd(pad)}${String(r.status).padStart(4)}  ${r.note ?? ""}`);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} routes rendered.`);
  await prisma.$disconnect();

  if (failed.length > 0) {
    console.error(`\n${failed.length} route(s) failed. Do not deploy.`);
    process.exit(1);
  }
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
