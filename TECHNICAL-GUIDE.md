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

## 4. The 15 modules

| Module | Route | Core logic |
|---|---|---|
| Inicio | `/` | Today's `BusinessDay` summary + top-margin products + low-stock alerts |
| Inventario | `/inventario` | Live `currentStock` per product, grouped by category, +/− buttons call `recordPurchase`/`recordAdjustment` directly (no period needed). Inline create + guarded delete (refuses if the product has sale/purchase history or is a recipe ingredient) |
| Registro diario | `/registro` | 5 tabs (Dueños/Consumiciones/Cortesía/Pedido/Resumen) mirroring Pablo's validated mockup's tap-to-count interaction, restyled with this project's own design system. Tap a quick-grid card → `recordConsumption` |
| Stock semanal | `/stock` | `StockPeriod`/`StockCount` grid — enter counted values, "Cerrar" freezes expected-vs-counted, writes one `PERIOD_CLOSE_RECONCILE` adjustment per variance, rolls counted forward as next period's initial |
| Cristalería y Vajilla | `/cristaleria` | `GlasswareItem` (Barra/Depósito, 24 real items) × `GlasswareMonthPeriod`/`GlasswareWeekEntry`/`GlasswareCount` — every week of the open month shown side by side, Diferencia = previous week's count minus current (stock base = week 0). "Cerrar mes" archives + rolls to next month. Matches Pablo's real paper sheet; printable PDF mirrors its layout |
| Compras & Pedidos | `/compras` | Purchase form (`recordPurchase`) + `ReorderItem` status tracker (PENDIENTE→PEDIDO→RECIBIDO) |
| Productos | `/productos` | Full CRUD, including the quick-grid emoji/color/sort fields |
| Costeo & Recetas | `/costeo` | Build a `Recipe` from `RecipeIngredient` rows, cost shown live |
| Recetario | `/recetario` | Ficha técnica per drink — photo (pasted URL), descripción, vaso/copa, guarnición, preparación (steps). Extends the same `Recipe` row Costeo writes to (doesn't duplicate the ingredient editor, links to Costeo for that). Printable A5 PDF per drink with the photo embedded |
| Precios & Rentabilidad | `/precios` | Sortable (worst-margin-first) per-product profit table, inline price editing |
| Proveedores | `/proveedores` | Supplier CRUD + category mapping |
| Reportes | `/reportes` | Links to 6 PDF routes (cierre-día, stock-semanal, rentabilidad, pedido, cristalería; ficha-técnica is linked per-drink from Recetario instead, since it needs a productId) |
| Estadísticas | `/estadisticas` | Top sellers, consumption mix, 14-day revenue/profit trend — CSS-bar charts, no chart library |
| Feedback | `/feedback` | Pablo reports bugs/feature-requests/workarounds, can paste a screenshot (Ctrl+V, client-compressed, stored as an encoded image string on `FeedbackItem.screenshotDataUrl`). `FeedbackItem.status` (Nuevo/En progreso/Resuelto/No se va a hacer) IS the tracking log — no separate file. Fires a best-effort webhook via `src/lib/notify.ts` to `BARMGMT_NOTIFY_HOOK` (silent no-op until set) for a future n8n → Telegram/WhatsApp ping — full build spec in `FEEDBACK-NOTIFY-N8N-SOP.md` |
| Ajustes | `/ajustes` | Venue name/currency, category list (read-only), password change |

## 5. Auth

`src/auth.ts` — Auth.js v5 (beta) Credentials provider, bcrypt password check against `User.passwordHash`, JWT session strategy. `src/lib/require-admin.ts`'s `requireAdmin()` is called at the top of every Server Action and every dashboard page — redirects to `/login` if no session. Admin-only in v1 (`User.role` exists in schema for future STAFF/ADMIN split, unused so far).

**Dev secret**: Auth.js v5 beta throws `MissingSecret` even in development (contrary to some docs). `src/auth.ts` falls back to a hardcoded non-secret placeholder when `BARMGMT_AUTH_SECRET` is unset — **production MUST set the real env var in Vercel before deploy**, or every session will be forgeable.

## 6. PDF reports

`@react-pdf/renderer`'s `pdf(<Document>...).toBlob()` API, returned directly as the Response body — no stream-piping needed. Route handlers must be `.tsx` (not `.ts`) since they contain JSX; this was a real bug caught during testing (all 4 routes 500'd until renamed). Shared styles in `src/lib/pdf/theme.tsx`.

## 7. Deploy — done, live at https://la-pulpe-three.vercel.app

**Stack**: GitHub (`sce-soyconscienciaelevada/La-Pulpe`, public) → Vercel (`inner-s-projects/la-pulpe`) → Neon Postgres (via Vercel's marketplace integration).

**What actually happened, in order** (useful if setting up a second bar/instance later):
1. `vercel login` — doesn't work non-interactively. Use its device-flow (`npx vercel login` prints a `vercel.com/oauth/device?user_code=...` URL) and have the account owner authorize it in their own browser.
2. `vercel link --yes --project <name>` from `site/` — creates the project, auto-connects the GitHub repo.
3. `vercel integration add neon` — provisions Neon and connects it to the project in one step. Free tier, no billing wall hit.
4. `vercel env pull --environment=production <non-.env-name>.txt`, extract `POSTGRES_PRISMA_URL` with `grep`/`cut`, pipe it (never print it) into `vercel env add BARMGMT_DB_CONN production` and `... preview`. Same for a freshly generated `BARMGMT_AUTH_SECRET`. Delete the temp dump file immediately after — it's not `.env`-named so `.gitignore`'s `.env*` rule doesn't catch it, and it contains raw secrets.
5. Swapped `prisma/schema.prisma` provider to `"postgresql"`, `src/lib/prisma.ts`'s adapter to `PrismaPg`, deleted the SQLite migration folder, ran a fresh `prisma migrate dev` + `prisma generate` + the seed script directly against the live Neon DB (export the connection string into the shell for that one command — Bash tool sessions don't persist env vars between calls, so this has to happen in a single chained command each time).
6. `git push origin main` — **does not auto-deploy**, see gotcha below. Deploy with `npx vercel --prod` from `site/` instead.
7. Set the real admin password directly on prod: `BARMGMT_DB_CONN=... npx tsx scripts/set-admin-password.ts '<new-password>'`.

**Gotcha 1 — GitHub webhook auto-deploy never fired.** Two separate `git push`es after the initial `vercel link` produced zero new deployments (`vercel ls` stayed at 1). Root cause not diagnosed. Until this is fixed: **every deploy needs a manual `npx vercel --prod`**, pushing to GitHub alone is not enough.

**Gotcha 2 — "Deployment Blocked" for 39+ minutes with no CLI-visible reason.** `vercel logs` / `vercel inspect` showed nothing useful (status stuck `UNKNOWN`, empty builds list) — the real error only showed up on the Vercel *dashboard's* deployment detail page: **"Deployment Blocked — commit author did not have contributing access... Hobby Plan doesn't support collaboration for private repositories."** Vercel checks the git commit author's GitHub identity against project access, separately from who's authenticated in the CLI. Fixed by making the GitHub repo public (the other options were adding the commit author as an explicit project member, or upgrading to Pro — both real tradeoffs, this one was free and fit the "sell this later" plan). **If build logs seem to vanish into a void again, check the dashboard deployment page directly — the CLI doesn't surface everything.**

**Gotcha 3 — Vercel's own login wall blocked the app before the app's login even ran.** Project Settings → Deployment Protection → "Require Log In" (Vercel Authentication) is ON by default for team-scoped projects and gates *every* deployment URL, including production, behind a Vercel-account + team-membership check. Pablo will never have a Vercel account. Turned it off — the app's own `/login` (admin-only credentials, `requireAdmin()` on every Server Action) is the real access control here, this was a redundant second gate in front of it.

## 8. Testing

Two separate scripts, deliberately not interchangeable:

- **`scripts/verify-app.ts`** — mutates data (creates products, taps fake sales, force-closes a stock period to test reconciliation). **Local/dev database only.** A from-scratch Playwright script (not `@playwright/test`, just raw `chromium.launch()`) that logs in, hits all 12 routes, exercises every golden path with real assertions, fetches all 4 PDFs and checks the `%PDF` magic bytes, and re-runs every route at a 375px viewport. 62/62 passing as of the last local run.
- **`scripts/verify-prod-readonly.ts`** — read-only, safe to run against the live production database anytime. Login, all 12 routes, one real PDF fetch, and a row-count check. Used to confirm the actual deploy after going live, without polluting Pablo's real data with test artifacts.
- **`scripts/verify-seed.ts`** — sanity check for seed data (counts, quick-grid mapping, recipes).
- **`scripts/set-admin-password.ts <new-password>`** — rotates the admin password directly against whatever `BARMGMT_DB_CONN` points at. Used to replace the seeded placeholder before real handoff.
- **`scripts/verify-feedback-updates.ts`** — Feedback screenshot paste + update-notification system. Simulates a clipboard paste via a synthetic `ClipboardEvent` with a real PNG fixture (Playwright can't reach the OS clipboard headlessly).

## 8b. Update notifications (bump this on every deploy)

`src/lib/version.ts` exports `APP_VERSION` + a `CHANGELOG` map. `/api/version` always reflects whatever's currently deployed (no caching). `UpdateChecker` (wired into the dashboard layout) polls that endpoint every 30s + on tab focus — the moment it differs from the version the page loaded with, a "Actualización disponible" banner appears with a reload button. `WhatsNewModal` shows the current version's changelog once per browser (localStorage key `barmgmt_seen_version`).

**Required step before every deploy that should notify users**: bump `APP_VERSION` in `src/lib/version.ts` and add a `CHANGELOG[APP_VERSION]` entry (title + bullet list). Skipping this means the deploy ships silently — no banner, no changelog — which is sometimes fine (invisible bugfixes) but should be a deliberate choice, not an oversight.

## 8c. Deploy checklist (run in this order)

```bash
npx tsc --noEmit                                    # types
npm run build                                       # build
grep -rl '"use client"' src | xargs grep -l "lib/prisma"   # must print nothing
BARMGMT_DB_CONN=... npx next dev -p 4002 &          # then, in another shell:
BARMGMT_DB_CONN=... npm run smoke                   # renders EVERY route, asserts 200
# bump APP_VERSION + CHANGELOG (see 8b), then:
npx vercel --prod
curl -s https://la-pulpe-three.vercel.app/api/version
```

**`npm run smoke` is not optional, and it is not the same check as `npm run build`.** On 2026-07-30 the Inicio page shipped a 500 through a green `tsc`, a green `next build`, *and* a script that exercised every one of its Prisma queries. The defect was a function prop (`formatValue={formatARS}`) passed from a Server Component to a Client Component — not serializable across the RSC boundary, and it only throws when a request actually renders the page. On a dynamic (`ƒ`) route, nothing at build time can see it. Joan found it by opening the page.

`scripts/smoke.ts` mints its own Auth.js JWT session cookie from the local dev secret, so it needs no password and writes nothing, and it discovers routes from the filesystem so it cannot go stale. It was verified to fail (`FAIL / 500`, exit 1) when the original defect is reintroduced.

Related, post-deploy: `scripts/verify-prod-readonly.ts` runs the same route sweep against live production with a real login (needs `BARMGMT_TEST_PASSWORD`). Both scripts now share route discovery via `scripts/routes.ts` — its route list used to be hardcoded and had gone stale at 14 routes while the app grew to 23, and it only *printed* statuses without ever failing, so a 500 would have scrolled by unnoticed. Both flaws are fixed.

## 9. Known limitations (decisions, not bugs)

- Quick-grid mappings for Cerveza/Vino/Whisky/Champagne/S·Alcohol picked a default SKU (Miller 330, Santa Julia Malbec, Johnny Red, Chandon Extra Brut, Agua Sin Gas) — needs Pablo's confirmation, not final.
- No sale prices seeded (source Excel never had them) — Precios shows "sin precio" until Pablo provides a list.
- WhatsApp share + Google Drive archive (present in Pablo's original mockup) are phase 2, not built.
- Kitchen/food module (pizzas etc. from the costing Excel) is phase 3, schema-ready via `Category.kind` but no UI.
- Staff logins (`User.role` beyond OWNER) are schema-ready, not built.
- `AuditLog` model exists but nothing writes to it yet.
- Recetario photos are pasted URLs, not real device upload — Vercel Blob isn't wired (`vercel integration discover blob` returns no marketplace product, it's dashboard-only). Same limitation Dolipa Store shipped with.
- Feedback's n8n → Telegram/WhatsApp notification isn't built — n8n MCP wasn't loaded in the session that built it. The app side is ready (`src/lib/notify.ts` posts to `BARMGMT_NOTIFY_HOOK`), just needs the actual n8n workflow.
- `git push` alone does not reliably trigger a Vercel redeploy (confirmed dead on 2+ pushes) — always follow up with `vercel --prod` from `site/` until this is root-caused.
- `vercel --prod` fails with a generic upload `fetch failed` on the first attempt most of the time in this dev environment — just retry, it has worked every time so far.
- After any Prisma schema migration, explicitly `rm -rf src/generated/prisma && npx prisma generate` before restarting the dev server — `migrate dev`'s automatic generate has not reliably refreshed an already-running server's client (new models throw `Cannot read properties of undefined (reading 'findMany')` otherwise).

## 10. Security note — a real credential leak happened here (2026-07-21)

The live admin password was briefly hardcoded in 3 Playwright test scripts and had **already leaked into public git history** from an earlier commit before it was caught (this repo is public — see §7). Response: rotated the password on the live DB immediately, verified the old value dead and the new one working, fixed every script to read from a `BARMGMT_TEST_PASSWORD` env var instead of a literal, and added a hard refusal gate to `verify-app.ts` requiring `CONFIRM_MUTATE_DB=yes` (dropping SQLite removed the last "safe" database to test against — every script now touches the same live data).

**Rules going forward, non-negotiable:**
- Never write a real password/token/connection-string as a literal in any file in this repo, including scripts, comments, or test fixtures.
- Test scripts read credentials from `BARMGMT_TEST_PASSWORD` (or similar), always with a harmless fallback (`"cambiar123"`) for scripts safe to run against a fresh/empty DB — never a real value.
- Before every commit, grep the staged diff for the current real password/secrets as a final check (`git diff --cached | grep -i <value>`) — caught the leak in `verify-inventario-crud.ts`/`verify-new-modules.ts`/`verify-prod-readonly.ts` this way before a *second* leak happened.
- If a credential is ever found in history again: rotate first, ask Joan about a history scrub (destructive rewrite + force-push) second — never scrub without his explicit go-ahead, and never treat "removed from the working tree" as equivalent to "safe" once a public push has happened.
<!-- updated: 2026-07-31 00:17 -->
