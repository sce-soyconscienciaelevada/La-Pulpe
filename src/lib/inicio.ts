import { prisma } from "@/lib/prisma";
import { getDaySummary } from "@/lib/register/day";
import type { ChartPoint, ChartSeries } from "@/components/ChartCard";
import type { DonutItem } from "@/components/Donut";

const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fullDateLabel(d: Date) {
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

function shortDateLabel(d: Date) {
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

export type ComparisonSummary = {
  weekdayLabel: string;
  revenue: number;
  profit: number;
  ownerCompCost: number;
  ownerCompCount: number;
  consumptionsCount: number;
};

// Compares today against the same weekday one week ago (not just "yesterday")
// so a Friday isn't judged against a quiet Thursday.
export async function getSameWeekdayLastWeek(
  venueId: string,
  today: Date,
  since?: Date | null
): Promise<ComparisonSummary | null> {
  const lastWeekDate = addDays(today, -7);
  // Never compare against a day that predates real use — it would read as a
  // collapse in sales when it is really just an empty pre-launch row.
  if (since && lastWeekDate < since) return null;
  const businessDay = await prisma.businessDay.findUnique({
    where: { venueId_date: { venueId, date: lastWeekDate } },
  });
  if (!businessDay) return null;

  const summary = await getDaySummary(businessDay.id);
  const ownerCompCost =
    summary.byType.OWNER.reduce((s, c) => s + c.quantity * c.unitCost, 0) +
    summary.byType.COMP.reduce((s, c) => s + c.quantity * c.unitCost, 0);

  return {
    weekdayLabel: WEEKDAYS[lastWeekDate.getDay()],
    revenue: summary.revenue,
    profit: summary.profit,
    ownerCompCost,
    ownerCompCount: summary.byType.OWNER.length + summary.byType.COMP.length,
    consumptionsCount: summary.consumptions.length,
  };
}

// Rolling 30-day average of consumptions/day, excluding today (today is still
// filling up), and only counting days the bar actually had activity — a
// closed Monday shouldn't drag the average down.
export async function getMonthlyAvgConsumptionCount(venueId: string, today: Date, since?: Date | null) {
  const window = addDays(today, -30);
  const from = since && since > window ? since : window;
  const to = addDays(today, -1);
  const rows = await prisma.consumption.findMany({
    where: { venueId, businessDay: { date: { gte: from, lte: to } } },
    select: { businessDay: { select: { date: true } } },
  });
  const byDay = new Map<string, number>();
  for (const r of rows) {
    const key = dayKey(r.businessDay.date);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  if (byDay.size === 0) return 0;
  const total = Array.from(byDay.values()).reduce((s, n) => s + n, 0);
  return total / byDay.size;
}

// Both chart periods ("14 d" and "Mes") come from one fetch spanning 60 days —
// enough to cover 30 current + 30 previous, the widest of the two.
// `since` is Venue.realDataStartedAt: days before the owner pressed "empezar"
// are excluded, so pre-launch test rows never show up as real trade.
export async function getRevenueSeries(
  venueId: string,
  today: Date,
  since?: Date | null
): Promise<ChartSeries[]> {
  const window = addDays(today, -59);
  const from = since && since > window ? since : window;
  const rows = await prisma.consumption.findMany({
    where: { venueId, type: "SALE", businessDay: { date: { gte: from, lte: today } } },
    select: { quantity: true, unitPriceCharged: true, businessDay: { select: { date: true } } },
  });
  const revenueByDay = new Map<string, number>();
  for (const r of rows) {
    const key = dayKey(r.businessDay.date);
    revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + r.quantity * r.unitPriceCharged);
  }

  function buildPoints(days: number): ChartPoint[] {
    const dates = Array.from({ length: days }, (_, i) => addDays(today, i - (days - 1)));
    const midIdx = Math.floor((dates.length - 1) / 2);
    return dates.map((date, i) => {
      const key = dayKey(date);
      const prevKey = dayKey(addDays(date, -days));
      return {
        key,
        dateLabel: fullDateLabel(date),
        axisLabel: i === 0 || i === midIdx || i === dates.length - 1 ? shortDateLabel(date) : undefined,
        current: revenueByDay.get(key) ?? 0,
        previous: revenueByDay.get(prevKey) ?? 0,
      };
    });
  }

  return [
    { label: "14 d", data: buildPoints(14) },
    { label: "Mes", data: buildPoints(30) },
  ];
}

export async function getCategorySalesToday(venueId: string, businessDayId: string): Promise<DonutItem[]> {
  const rows = await prisma.consumption.findMany({
    where: { businessDayId, type: "SALE" },
    include: { product: { include: { category: true } } },
  });
  const byCategory = new Map<string, { label: string; value: number }>();
  for (const r of rows) {
    const key = r.product?.category?.id ?? "otro";
    const label = r.product?.category?.name ?? "Otro";
    const existing = byCategory.get(key) ?? { label, value: 0 };
    existing.value += r.quantity * r.unitPriceCharged;
    byCategory.set(key, existing);
  }
  return Array.from(byCategory.entries())
    .map(([key, v]) => ({ key, label: v.label, value: v.value }))
    .sort((a, b) => b.value - a.value);
}
