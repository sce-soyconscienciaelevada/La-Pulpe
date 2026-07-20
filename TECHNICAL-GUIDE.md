# Bar Management Dashboard — Technical Guide

How this actually works. Written 2026-07-20 after the v1 build session — `../log.md` has the chronological story, this is the "how does it work" reference.

---

## 1. Architecture

```
Browser (Pablo, admin) ──> Vercel (Next.js app + server code) ──> Neon (Postgres, once deployed)
                                                                  └──> local: SQLite (dev.db)
```

One Next.js app: public login + the whole admin dashboard behind it. No separate backend — Server Actions and Route Handlers ARE the backend.

**Not deployed yet.** Currently runs locally against SQLite. Deploy = provision Vercel + Neon, set env vars, swap the DB provider (see §7).

## 2. Database

18 Prisma models in `prisma/schema.prisma`, grouped:
- **Core**: `Venue`, `User` (admin login), `Person` (dueños/staff/bandas)
- **Catalog**: `Category`, `Product` (universal SKU — bottles, glassware, disposables, cocktails), `ProductPriceHistory`, `Supplier`
- **Daily register**: `BusinessDay`, `Consumption` (every tap in Registro diario), `ReorderItem`
- **Stock ledger**: `Purchase`, `StockAdjustment`, `StockPeriod`, `StockCount`
- **Recipes**: `Recipe`, `RecipeIngredient`
- **Audit**: `AuditLog` (defined, not yet wired to any writes)

**The ledger rule**: `Product.currentStock` is a denormalized cache, never edited directly. Every stock change goes through `src/lib/stock/movements.ts` (`recordPurchase`, `recordConsumption`, `recordAdjustment`), each wrapped in a `prisma.$transaction` that writes the movement row AND updates `currentStock` atomically. Weekly counts (`StockCount`) true it up via `closeStockPeriod` in `src/lib/stock/period.ts`.

**Units**: `Consumption.quantity` is servings ("medidas"). `Purchase.quantity`, `StockAdjustment.quantityDelta`, `Product.currentStock` are containers (bottles/cans/kegs). Conversion happens only at read/write time via `Product.servingsPerContainer`.

## 3. The profitability math (the actual point of the app)

`src/lib/pricing.ts` — `computePricing()`:
```
costPerServing = costPricePerContainer / servingsPerContainer
profitPerServing = salePricePerServing - costPerServing
marginPercent = profitPerServing / salePricePerServing * 100
```
Never stored — computed at read time everywhere it's shown (Precios table, Inicio's "top tragos", the Reportes PDFs). Worked example baked into the seed data: a $20 bottle with 12.5 medidas costs $1.60/medida; sold at $10 → $8.40 profit, 84% margin.

Cocktail costing (`src/lib/costeo.ts`) sums each `RecipeIngredient.quantity` (interpreted as "medidas of that ingredient", not raw ml — matches how pours are actually measured) times that ingredient's `costPerServing`, divided by `Recipe.yieldServings`.

**Revenue/profit for a day** (`src/lib/register/day.ts`, `getDaySummary`): `Revenue = Σ SALE-type qty×unitPriceCharged`. `COGS = Σ ALL-type qty×unitCost` — meaning owner drinks and cortesía show up as real cost dragging down `Ganancia`, not as invisible giveaways. `unitCost`/`unitPriceCharged` are snapshotted onto each `Consumption` row at tap time, so historical numbers don't drift if a price changes later.

## 4. The 12 modules

| Module | Route | Core logic |
|---|---|---|
| Inicio | `/` | Today's `BusinessDay` summary + top-margin products + low-stock alerts |
| Inventario | `/inventario` | Live `currentStock` per product, grouped by category, +/− buttons call `recordPurchase`/`recordAdjustment` directly (no period needed) |
| Registro diario | `/registro` | 5 tabs (Dueños/Consumiciones/Cortesía/Pedido/Resumen) mirroring Pablo's validated mockup's tap-to-count interaction, restyled with this project's own design system. Tap a quick-grid card → `recordConsumption` |
| Stock semanal | `/stock` | `StockPeriod`/`StockCount` grid — enter counted values, "Cerrar" freezes expected-vs-counted, writes one `PERIOD_CLOSE_RECONCILE` adjustment per variance, rolls counted forward as next period's initial |
| Compras & Pedidos | `/compras` | Purchase form (`recordPurchase`) + `ReorderItem` status tracker (PENDIENTE→PEDIDO→RECIBIDO) |
| Productos | `/productos` | Full CRUD, including the quick-grid emoji/color/sort fields |
| Costeo & Recetas | `/costeo` | Build a `Recipe` from `RecipeIngredient` rows, cost shown live |
| Precios & Rentabilidad | `/precios` | Sortable (worst-margin-first) per-product profit table, inline price editing |
| Proveedores | `/proveedores` | Supplier CRUD + category mapping |
| Reportes | `/reportes` | Links to 4 PDF routes |
| Estadísticas | `/estadisticas` | Top sellers, consumption mix, 14-day revenue/profit trend — CSS-bar charts, no chart library |
| Ajustes | `/ajustes` | Venue name/currency, category list (read-only), password change |

## 5. Auth

`src/auth.ts` — Auth.js v5 (beta) Credentials provider, bcrypt password check against `User.passwordHash`, JWT session strategy. `src/lib/require-admin.ts`'s `requireAdmin()` is called at the top of every Server Action and every dashboard page — redirects to `/login` if no session. Admin-only in v1 (`User.role` exists in schema for future STAFF/ADMIN split, unused so far).

**Dev secret**: Auth.js v5 beta throws `MissingSecret` even in development (contrary to some docs). `src/auth.ts` falls back to a hardcoded non-secret placeholder when `BARMGMT_AUTH_SECRET` is unset — **production MUST set the real env var in Vercel before deploy**, or every session will be forgeable.

## 6. PDF reports

`@react-pdf/renderer`'s `pdf(<Document>...).toBlob()` API, returned directly as the Response body — no stream-piping needed. Route handlers must be `.tsx` (not `.ts`) since they contain JSX; this was a real bug caught during testing (all 4 routes 500'd until renamed). Shared styles in `src/lib/pdf/theme.tsx`.

## 7. Deploy — not done yet, here's the plan

1. Joan provides a GitHub destination; `git remote add origin ...` + push (repo is already initialized locally, first commit `de136ac`).
2. Provision Neon via Vercel's Storage tab (same flow as Dolipa Store).
3. In `prisma/schema.prisma`, change `datasource db { provider = "sqlite" }` to `"postgresql"`.
4. In `src/lib/prisma.ts`, swap `PrismaBetterSqlite3` for `PrismaPg` (`@prisma/adapter-pg`, already a dependency) pointed at `BARMGMT_DB_CONN`.
5. Fresh migration history against Postgres (Prisma won't let one history span two providers — same thing Dolipa hit).
6. Set `BARMGMT_DB_CONN` and `BARMGMT_AUTH_SECRET` in Vercel env vars (real values, not the dev fallback).
7. Run the seed script against the live Neon DB once, with Joan's explicit confirmation before each direct-DB action (per this vault's standing rule).
8. Change the seeded admin password (`pablo@lapulpe.local` / `cambiar123`) before handing off to Pablo.
9. Re-run `scripts/verify-app.ts` against the live URL (update `BASE` constant) to confirm the deploy actually works, not just that the build succeeded.

## 8. Testing

`scripts/verify-app.ts` — a from-scratch Playwright script (not `@playwright/test`, just raw `chromium.launch()`) that logs in, hits all 12 routes, exercises every golden path with real assertions (not just "page loaded"), fetches all 4 PDFs and checks the `%PDF` magic bytes, and re-runs every route at a 375px viewport checking `document.documentElement.scrollWidth`. Currently 62/62 passing. Re-run anytime with `npx tsx scripts/verify-app.ts` against a running dev server. `scripts/verify-seed.ts` is a smaller sanity check for the seed data specifically.

## 9. Known limitations (decisions, not bugs)

- Quick-grid mappings for Cerveza/Vino/Whisky/Champagne/S·Alcohol picked a default SKU (Miller 330, Santa Julia Malbec, Johnny Red, Chandon Extra Brut, Agua Sin Gas) — needs Pablo's confirmation, not final.
- No sale prices seeded (source Excel never had them) — Precios shows "sin precio" until Pablo provides a list.
- WhatsApp share + Google Drive archive (present in Pablo's original mockup) are phase 2, not built.
- Kitchen/food module (pizzas etc. from the costing Excel) is phase 3, schema-ready via `Category.kind` but no UI.
- Staff logins (`User.role` beyond OWNER) are schema-ready, not built.
- `AuditLog` model exists but nothing writes to it yet.
<!-- updated: 2026-07-20 02:04 -->
