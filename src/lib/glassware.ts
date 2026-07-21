import { prisma } from "@/lib/prisma";

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function currentMonthLabel(date: Date = new Date()) {
  return `${MONTHS_ES[date.getMonth()]} ${date.getFullYear()}`;
}

export async function getOrCreateOpenMonth(venueId: string) {
  const existing = await prisma.glasswareMonthPeriod.findFirst({
    where: { venueId, status: "OPEN" },
    orderBy: { startDate: "desc" },
  });
  if (existing) return existing;
  return prisma.glasswareMonthPeriod.create({
    data: { venueId, label: currentMonthLabel() },
  });
}

export async function addWeekEntry(monthPeriodId: string) {
  const last = await prisma.glasswareWeekEntry.findFirst({
    where: { monthPeriodId },
    orderBy: { weekNumber: "desc" },
  });
  const weekNumber = (last?.weekNumber ?? 0) + 1;
  return prisma.glasswareWeekEntry.create({
    data: { monthPeriodId, weekNumber, label: `Semana ${weekNumber}` },
  });
}

/** Diferencia = previous week's count minus this week's count (stockBase counts as "week 0"). */
export function computeDiff(previous: number, current: number) {
  return previous - current;
}
