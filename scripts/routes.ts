// Single source of truth for "what routes does this app have".
//
// Both scripts/smoke.ts (pre-deploy, local) and scripts/verify-prod-readonly.ts
// (post-deploy, live) import this. It is derived from the filesystem rather
// than hardcoded because the hardcoded list in verify-prod-readonly.ts silently
// went stale — it still listed 14 routes after 9 more had been added, so whole
// modules (heladeras, inventario-barra, ventas-pos, recetario) were never
// checked by anything.

import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/** Walk src/app and turn every page.tsx into a URL path. */
export function discoverRoutes(appDir: string, urlParts: string[] = []): string[] {
  const routes: string[] = [];
  for (const entry of readdirSync(appDir)) {
    const full = join(appDir, entry);
    if (!statSync(full).isDirectory()) continue;
    // (group) segments don't appear in the URL; @slots and _private are skipped.
    if (entry.startsWith("_") || entry.startsWith("@")) continue;
    const isGroup = entry.startsWith("(") && entry.endsWith(")");
    const nextParts = isGroup ? urlParts : [...urlParts, entry];
    if (readdirSync(full).includes("page.tsx")) {
      routes.push("/" + nextParts.join("/"));
    }
    routes.push(...discoverRoutes(full, nextParts));
  }
  return routes;
}

/** Every renderable page route, excluding API handlers. */
export function allRoutes(appDir: string): string[] {
  return discoverRoutes(appDir)
    .filter((r) => !r.startsWith("/api"))
    .sort();
}

/** Routes with no [dynamic] segment — safe to hit without resolving an id. */
export function staticRoutes(appDir: string): string[] {
  return allRoutes(appDir).filter((r) => !r.includes("["));
}
