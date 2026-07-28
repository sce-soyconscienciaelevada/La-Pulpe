// Pure helpers safe to import from Client Components — no Prisma/pg import
// here, since that would leak Node-only modules (net/tls/pg) into the
// browser bundle. Server-only DB helpers live in ventas-pos.ts instead.

export const POS_CATEGORIAS_CONOCIDAS = [
  "Bebidas sin alcohol",
  "Cervezas",
  "Chopp",
  "Vinos Tintos",
  "Vinos Blancos",
  "Jarras",
  "Tragos Especiales",
  "Destilados",
  "Los de Siempre",
  "Otros",
];

export function periodLengthDays(startAt: Date, endAt: Date): number {
  const ms = endAt.getTime() - startAt.getTime();
  return Math.max(ms / (1000 * 60 * 60 * 24), 1 / 24); // floor at 1 hour to avoid /0
}

export function sharePercent(part: number, total: number): number | null {
  if (!total) return null;
  return (part / total) * 100;
}

export function formatShare(part: number, total: number): string {
  const pct = sharePercent(part, total);
  return pct === null ? "—" : `${pct.toFixed(1)}%`;
}
