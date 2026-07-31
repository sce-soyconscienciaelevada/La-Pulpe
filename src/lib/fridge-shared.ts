// Pure helpers safe to import from Client Components — no Prisma import
// here (see ventas-pos-shared.ts for the same split, same reason).
import { startOfDayInTz } from "@/lib/day-boundary";

export type FridgeStatus = "verde" | "amarillo" | "rojo" | "sin-lectura";

export function computeFridgeStatus(tempC: number | null | undefined): FridgeStatus {
  if (tempC === null || tempC === undefined) return "sin-lectura";
  if (tempC <= 8) return "verde";
  if (tempC <= 11) return "amarillo";
  return "rojo";
}

export const FRIDGE_STATUS_LABEL: Record<FridgeStatus, string> = {
  verde: "Correcto",
  amarillo: "Alerta",
  rojo: "Fuera de rango",
  "sin-lectura": "Sin lectura",
};

export const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Same fix as the business day: setHours(0,0,0,0) resolved midnight in the
// SERVER's timezone, so on Vercel (UTC) the fridge week shifted a day forward
// after 21:00 Cordoba. FridgeTempEntry has @@unique([unitId, date]), so that
// produced the same duplicate-row exposure. See src/lib/day-boundary.ts.
function atMidnight(d: Date) {
  return startOfDayInTz(d);
}

// Monday..Sunday week containing `anchor`.
export function getWeekDates(anchor: Date): Date[] {
  const start = atMidnight(anchor);
  const dow = start.getDay(); // 0 = Sunday
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  start.setDate(start.getDate() + diffToMonday);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function formatWeekLabel(dates: Date[]): string {
  const fmt = (d: Date) => d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
  return `${fmt(dates[0])} al ${fmt(dates[6])}`;
}

export function addWeeks(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n * 7);
  return copy;
}

export const DEFAULT_FRIDGE_UNITS = [
  { code: "H1", name: "Heladera 1" },
  { code: "H2", name: "Heladera 2" },
  { code: "H3", name: "Heladera 3" },
  { code: "H4", name: "Heladera 4" },
  { code: "H5", name: "Heladera 5" },
  { code: "H6", name: "Heladera 6" },
];
