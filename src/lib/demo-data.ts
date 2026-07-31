// Sample figures for the Inicio dashboard, shown until the owner presses
// "Empezar a cargar mis datos" (which stamps Venue.realDataStartedAt).
//
// Deliberately DETERMINISTIC, not Math.random(): a chart that redraws with
// different numbers on every refresh reads as broken rather than as an
// example. Same day in, same shape out.
//
// Pure functions, no Prisma import, so this is safe to pull into a Client
// Component if that is ever needed.

import type { ChartSeries } from "@/components/ChartCard";
import type { DonutItem } from "@/components/Donut";
import type { SegmentedBarItem } from "@/components/SegmentedBar";

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

/** Small deterministic hash so the same date always yields the same figure. */
function jitter(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x); // 0..1
}

// A bar's week: quiet Monday/Tuesday, busy Friday/Saturday. Indexed by getDay().
const WEEKDAY_WEIGHT = [0.75, 0.35, 0.4, 0.55, 0.7, 1.0, 1.15];

function dayRevenue(date: Date, offset: number): number {
  const base = 180_000;
  const weekday = WEEKDAY_WEIGHT[date.getDay()];
  const wobble = 0.85 + jitter(date.getDate() + date.getMonth() * 31 + offset) * 0.3;
  return Math.round((base * weekday * wobble) / 1000) * 1000;
}

export function demoRevenueSeries(today: Date): ChartSeries[] {
  function build(days: number) {
    const dates = Array.from({ length: days }, (_, i) => addDays(today, i - (days - 1)));
    const mid = Math.floor((dates.length - 1) / 2);
    return dates.map((date, i) => ({
      key: `demo-${days}-${i}`,
      dateLabel: `${WEEKDAYS[date.getDay()]} ${date.getDate()} de ${MONTHS[date.getMonth()]}`,
      axisLabel:
        i === 0 || i === mid || i === dates.length - 1
          ? `${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3)}`
          : undefined,
      current: dayRevenue(date, 0),
      previous: dayRevenue(addDays(date, -days), 7),
    }));
  }
  return [
    { label: "14 d", data: build(14) },
    { label: "Mes", data: build(30) },
  ];
}

export const DEMO_KPIS = {
  revenue: 487_350,
  profit: 312_180,
  ownerCompCost: 18_640,
  ownerCompCount: 14,
  tragos: 143,
  revenueDeltaPct: 11.4,
  revenueDeltaAbs: 49_870,
  ownerCompDeltaPct: -3.1,
  tragosDeltaPct: -4.0,
  tragosDeltaAbs: -6,
};

export const DEMO_MIX: SegmentedBarItem[] = [
  { key: "SALE", label: "Venta", value: 125, color: "var(--profit)" },
  { key: "OWNER", label: "Dueños", value: 8, color: "var(--comp)" },
  { key: "COMP", label: "Cortesía", value: 7, color: "var(--accent)" },
  { key: "BAND_ALLOWANCE", label: "Banda", value: 3, color: "var(--text-faint)" },
];

export const DEMO_CATEGORIES: DonutItem[] = [
  { key: "c1", label: "Cervezas", value: 198_000 },
  { key: "c2", label: "Tragos", value: 146_000 },
  { key: "c3", label: "Vinos", value: 87_000 },
  { key: "c4", label: "Sin alcohol", value: 55_000 },
];
