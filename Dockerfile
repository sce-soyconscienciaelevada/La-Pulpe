# Multi-stage build for EasyPanel. Bar Management Dashboard deploys to Vercel
# for prod (no Dockerfile needed there) — this Dockerfile exists ONLY for the
# demo deploy on Joan's VPS/EasyPanel, following the exact pattern already
# proven live for the sibling Micelo Management Dashboard (same schema
# conventions, same Next 16 + Prisma 7 + @prisma/adapter-pg stack).
#
# Deliberately NOT using Next's "standalone" output + trace-and-copy pattern —
# Micelo's real prod deploy hit a silent failure there (dropped
# @prisma/adapter-pg + never included the custom-output generated Prisma
# client). Full node_modules copied through, `next start` at runtime instead.

FROM node:22-alpine AS base

# ---- deps ----
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# --ignore-scripts: package.json's postinstall runs `prisma generate`, which
# needs prisma/schema.prisma — not present yet in this minimal-context stage.
RUN npm ci --ignore-scripts

# ---- build ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `prisma generate` only parses the schema — never opens a DB connection —
# but prisma.config.ts throws if BARMGMT_DB_CONN is completely unset. A
# harmless placeholder satisfies that check without the real connection
# string ever needing to pass through a Docker --build-arg (which would bake
# it into image layer history). The real BARMGMT_DB_CONN only needs to exist
# as a runtime container env var (EasyPanel's Environment tab).
ENV BARMGMT_DB_CONN="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate
RUN npm run build

# ---- runner ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
# `src/` isn't needed by `next start` (compiled .next output is), but
# `npm run seed`/`seed:demo` (prisma/seed*.ts) import it directly by relative
# path, and tsx needs tsconfig.json above to resolve the `@/*` alias.
COPY --from=builder --chown=nextjs:nodejs /app/src ./src

USER nextjs
EXPOSE 3000
ENV PORT=3000

# Auto-apply committed migrations on boot. `migrate deploy` only applies
# migrations not yet in _prisma_migrations, so re-running against an
# already-migrated DB is a safe no-op. Reconsider only if this ever runs
# with >1 replica (migrate-on-boot race) — not a concern for a single-replica
# demo deploy.
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start"]
