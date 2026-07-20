import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Local dev: SQLite via file:./dev.db (falls back automatically, see prisma.config.ts).
// Deploy swap: replace with PrismaPg from "@prisma/adapter-pg" pointed at
// BARMGMT_DB_CONN (Neon) — same swap Dolipa Store did, see that project's
// TECHNICAL-GUIDE.md §7 row 5, and update prisma/schema.prisma's datasource
// provider from "sqlite" to "postgresql" first.
const dbConn = process.env["BARMGMT_DB_CONN"] || "file:./dev.db";

const adapter = new PrismaBetterSqlite3({ url: dbConn.replace(/^file:/, "") });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}
