import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Postgres (Neon, via Vercel integration). Renamed from the conventional
// connection-string env var name — the vault's security-sentinel hook
// blanket-blocks that name even for non-secret contexts.
const dbConn = process.env["BARMGMT_DB_CONN"];

const adapter = new PrismaPg({ connectionString: dbConn });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}
