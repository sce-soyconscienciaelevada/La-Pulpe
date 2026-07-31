import { prisma } from "@/lib/prisma";
import { getOrCreateBusinessDay, getDaySummary } from "@/lib/register/day";
import {
  getSameWeekdayLastWeek,
  getMonthlyAvgConsumptionCount,
  getRevenueSeries,
  getCategorySalesToday,
} from "@/lib/inicio";
import { computePricing } from "@/lib/pricing";
import {
  PageHeader,
  Card,
  KpiBox,
  Kpi,
  SectionHead,
  Avatar,
  Table,
  TableFoot,
  Badge,
  formatARS,
} from "@/components/ui";
import { ChartCard } from "@/components/ChartCard";
import { SegmentedBar } from "@/components/SegmentedBar";
import { Donut } from "@/components/Donut";
import { DemoBanner } from "@/components/DemoBanner";
import { ProductIcon } from "@/components/ProductIcon";
import { demoRevenueSeries, DEMO_KPIS, DEMO_MIX, DEMO_CATEGORIES } from "@/lib/demo-data";
import Link from "next/link";

function localHour(date: Date, timeZone: string) {
  const raw = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hour12: false }).format(date);
  return Number(raw) % 24;
}

function greetingWord(hour: number) {
  if (hour < 6) return "Buenas noches";
  if (hour < 12) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function Delta({
  pct,
  absLabel,
  contextLabel,
}: {
  pct: number | null;
  absLabel?: string;
  contextLabel: string;
}) {
  if (pct === null) {
    return (
      <>
        {absLabel && <span>{absLabel}</span>}
        <span>{contextLabel}</span>
      </>
    );
  }
  const up = pct >= 0;
  return (
    <>
      <span className={up ? "text-profit" : "text-loss"}>
        {up ? "▲" : "▼"} {Math.abs(pct).toFixed(1).replace(".", ",")}%
      </span>
      {absLabel && <span>{absLabel}</span>}
      <span>{contextLabel}</span>
    </>
  );
}

const TYPE_LABEL: Record<string, string> = {
  SALE: "venta",
  OWNER: "dueños",
  COMP: "cortesía",
  BAND_ALLOWANCE: "banda",
};
const TYPE_TONE: Record<string, "accent" | "loss" | "profit" | "comp"> = {
  SALE: "accent",
  OWNER: "loss",
  COMP: "profit",
  BAND_ALLOWANCE: "comp",
};

export default async function InicioPage() {
  const venue = await prisma.venue.findFirstOrThrow();
  const day = await getOrCreateBusinessDay(venue.id);
  const summary = await getDaySummary(day.id);
  const now = new Date();

  // Null until the owner presses "empezar" in the demo banner. While null the
  // dashboard shows sample figures so the layout can be judged before there is
  // any trade to show; once set it is day one and only real data is counted.
  const since = venue.realDataStartedAt;
  const isDemo = since === null;

  const [comparison, avgTragos, realChartSeries, realCategorySales] = await Promise.all([
    getSameWeekdayLastWeek(venue.id, day.date, since),
    getMonthlyAvgConsumptionCount(venue.id, day.date, since),
    getRevenueSeries(venue.id, day.date, since),
    getCategorySalesToday(venue.id, day.id),
  ]);

  const lowStock = await prisma.product.findMany({
    where: { venueId: venue.id, reorderThreshold: { not: null } },
    include: { category: true },
  });
  const lowStockFiltered = lowStock.filter(
    (p) => p.reorderThreshold !== null && p.currentStock <= p.reorderThreshold
  );

  const sellableProducts = await prisma.product.findMany({
    where: { venueId: venue.id, isSellable: true, salePricePerServing: { not: null } },
    include: { category: true },
  });
  const topByMargin = sellableProducts
    .map((p) => ({
      ...p,
      pricing: computePricing({
        costPricePerContainer: p.costPricePerContainer,
        servingsPerContainer: p.servingsPerContainer,
        salePricePerServing: p.salePricePerServing,
      }),
    }))
    .sort((a, b) => (b.pricing.marginPercent ?? 0) - (a.pricing.marginPercent ?? 0))
    .slice(0, 5);

  const withoutPrice = await prisma.product.count({
    where: { venueId: venue.id, isSellable: true, salePricePerServing: null },
  });

  const realOwnerCompCost =
    summary.byType.OWNER.reduce((s, c) => s + c.quantity * c.unitCost, 0) +
    summary.byType.COMP.reduce((s, c) => s + c.quantity * c.unitCost, 0);

  // Every figure below resolves to the sample set while isDemo is true, so the
  // dashboard is never half real and half invented.
  const revenue = isDemo ? DEMO_KPIS.revenue : summary.revenue;
  const profit = isDemo ? DEMO_KPIS.profit : summary.profit;
  const ownerCompCostToday = isDemo ? DEMO_KPIS.ownerCompCost : realOwnerCompCost;
  const ownerCompCountToday = isDemo
    ? DEMO_KPIS.ownerCompCount
    : summary.byType.OWNER.length + summary.byType.COMP.length;
  const tragosCount = isDemo ? DEMO_KPIS.tragos : summary.consumptions.length;
  const marginPercent = revenue > 0 ? (profit / revenue) * 100 : 0;

  const revenuePct = isDemo
    ? DEMO_KPIS.revenueDeltaPct
    : comparison
      ? pctDelta(summary.revenue, comparison.revenue)
      : null;
  const revenueAbs = isDemo
    ? formatARS(DEMO_KPIS.revenueDeltaAbs)
    : comparison
      ? formatARS(summary.revenue - comparison.revenue)
      : undefined;
  const ownerCompPct = isDemo
    ? DEMO_KPIS.ownerCompDeltaPct
    : comparison
      ? pctDelta(ownerCompCostToday, comparison.ownerCompCost)
      : null;
  const tragosPct = isDemo ? DEMO_KPIS.tragosDeltaPct : avgTragos > 0 ? pctDelta(tragosCount, avgTragos) : null;
  const tragosAbs = isDemo
    ? `(${DEMO_KPIS.tragosDeltaAbs})`
    : avgTragos > 0
      ? `(${tragosCount - Math.round(avgTragos) >= 0 ? "+" : ""}${tragosCount - Math.round(avgTragos)})`
      : undefined;

  const chartSeries = isDemo ? demoRevenueSeries(day.date) : realChartSeries;
  const categorySales = isDemo ? DEMO_CATEGORIES : realCategorySales;
  const mixItems = isDemo
    ? DEMO_MIX
    : [
        { key: "SALE", label: "Venta", value: summary.byType.SALE.length, color: "var(--profit)" },
        { key: "OWNER", label: "Dueños", value: summary.byType.OWNER.length, color: "var(--comp)" },
        { key: "COMP", label: "Cortesía", value: summary.byType.COMP.length, color: "var(--accent)" },
        { key: "BAND_ALLOWANCE", label: "Banda", value: summary.byType.BAND_ALLOWANCE.length, color: "var(--text-faint)" },
      ];
  const categoryTotal = categorySales.reduce((s, c) => s + c.value, 0);
  const mixTotal = mixItems.reduce((s, m) => s + m.value, 0);

  const pendingParts: string[] = [];
  if (lowStockFiltered.length > 0) {
    pendingParts.push(`${lowStockFiltered.length} producto${lowStockFiltered.length === 1 ? "" : "s"} con stock bajo`);
  }
  if (withoutPrice > 0) {
    pendingParts.push(`${withoutPrice} sin precio de venta`);
  }
  const greetingSubtitle = pendingParts.length > 0 ? `Hoy tenés ${pendingParts.join(" y ")}.` : "Sin pendientes — todo al día.";

  const recent = [...summary.consumptions].reverse().slice(0, 15);

  return (
    <div>
      <PageHeader
        eyebrow={now.toLocaleDateString("es-AR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          timeZone: venue.timezone,
        })}
        title={greetingWord(localHour(now, venue.timezone))}
        subtitle={greetingSubtitle}
        action={
          <Link href="/registro" className="inline-block bg-accent text-bg font-semibold rounded-md px-4 py-2 text-sm">
            Cargar consumición →
          </Link>
        }
      />

      {isDemo && <DemoBanner />}

      <div className="mb-4">
        <KpiBox>
          <Kpi
            label="Ventas del día"
            value={formatARS(revenue)}
            delta={
              isDemo ? (
                <Delta pct={revenuePct} absLabel={`(${revenueAbs})`} contextLabel="vs. mismo día la semana pasada" />
              ) : comparison ? (
                <Delta pct={revenuePct} absLabel={`(${revenueAbs})`} contextLabel={`vs. ${comparison.weekdayLabel} pasado`} />
              ) : (
                <span>Sin dato de {weekdayName(day.date)} para comparar</span>
              )
            }
          />
          <Kpi
            label="Ganancia del día"
            value={formatARS(profit)}
            tone={profit >= 0 ? "profit" : "loss"}
            delta={
              <span className={marginPercent >= 0 ? "text-profit" : "text-loss"}>
                {marginPercent.toFixed(1).replace(".", ",")}% margen sobre ventas
              </span>
            }
          />
          <Kpi
            label="Dueños y cortesía"
            value={formatARS(ownerCompCostToday)}
            tone="comp"
            delta={
              <Delta
                pct={ownerCompPct}
                absLabel={`(${ownerCompCountToday} consumiciones)`}
                contextLabel={
                  isDemo ? "sin cargo" : comparison ? `vs. ${comparison.weekdayLabel} pasado` : "sin cargo"
                }
              />
            }
          />
          <Kpi
            label="Tragos servidos"
            value={String(tragosCount)}
            delta={<Delta pct={tragosPct} absLabel={tragosAbs} contextLabel="vs. promedio del mes" />}
          />
        </KpiBox>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] gap-4 mb-4">
        <ChartCard
          headlineLabel={isDemo ? "Ventas del período (ejemplo)" : "Ventas del período"}
          series={chartSeries}
          format="currency"
          previousLegend="Período anterior"
          currentLegend="Este período"
        />

        <div className="flex flex-col gap-4">
          <Card>
            <SectionHead
              title="Mezcla de consumo"
              hint={isDemo ? `${mixTotal} (ejemplo)` : `${summary.consumptions.length} hoy`}
            />
            <SegmentedBar items={mixItems} formatValue={(n) => String(n)} />
          </Card>

          <Card>
            <SectionHead title="Ventas por categoría" hint={isDemo ? "ejemplo" : undefined} />
            <Donut items={categorySales} total={categoryTotal} formatValue={formatARS} />
          </Card>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <SectionHead title="Top tragos por rentabilidad" />
          {topByMargin.length === 0 ? (
            <p className="text-sm text-text-muted">
              Sin precios de venta cargados todavía —{" "}
              <Link href="/precios" className="text-accent underline">
                cargalos en Precios &amp; Rentabilidad
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-2">
              {topByMargin.map((p) => (
                <li key={p.id} className="flex items-center gap-2 justify-between text-sm">
                  <span className="flex items-center gap-2 text-text min-w-0">
                    <ProductIcon categoryName={p.category?.name} className="inline-block w-4 h-4 shrink-0 text-text-muted" />
                    <span className="truncate">{p.name}</span>
                  </span>
                  <Badge tone="profit">{p.pricing.marginPercent?.toFixed(0)}% margen</Badge>
                </li>
              ))}
            </ul>
          )}
          {withoutPrice > 0 && (
            <p className="text-xs text-text-muted mt-3">{withoutPrice} productos sin precio de venta cargado.</p>
          )}
        </Card>

        <Card>
          <SectionHead title="Alertas de stock bajo" />
          {lowStockFiltered.length === 0 ? (
            <p className="text-sm text-text-muted">Sin alertas — definí umbrales en Productos para activarlas.</p>
          ) : (
            <ul className="space-y-2">
              {lowStockFiltered.map((p) => (
                <li key={p.id} className="flex items-center gap-2 justify-between text-sm">
                  <span className="flex items-center gap-2 text-text min-w-0">
                    <ProductIcon categoryName={p.category?.name} className="inline-block w-4 h-4 shrink-0 text-text-muted" />
                    <span className="truncate">{p.name}</span>
                  </span>
                  <Badge tone="loss">{p.currentStock.toFixed(1)} / mín. {p.reorderThreshold}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-0">
        <div className="p-4 sm:p-5 pb-0">
          <SectionHead title="Últimas consumiciones" hint="en vivo · turno de hoy" />
        </div>
        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
          <Table>
            <thead>
              <tr className="text-left text-text-faint font-mono text-[0.6875rem] uppercase tracking-wide">
                <th className="px-3 py-2">Hora</th>
                <th className="px-3 py-2">Producto</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Para</th>
                <th className="px-3 py-2 text-right">Importe</th>
                <th className="px-3 py-2 text-right">Margen</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-sm text-text-muted">
                    Todavía no hay consumiciones registradas hoy. Esta tabla siempre muestra
                    movimientos reales, nunca ejemplos, así que se va a ir llenando sola a medida
                    que cargues consumiciones en el Registro diario.
                  </td>
                </tr>
              ) : (
                recent.map((c) => {
                  const importe = c.quantity * c.unitPriceCharged;
                  const marginPct = c.unitPriceCharged > 0 ? ((c.unitPriceCharged - c.unitCost) / c.unitPriceCharged) * 100 : null;
                  const who = c.person?.name ?? "Barra";
                  return (
                    <tr key={c.id} className="border-t border-border text-sm">
                      <td className="px-3 py-2 font-mono text-text-faint tabular-nums">
                        {c.createdAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: venue.timezone })}
                      </td>
                      <td className="px-3 py-2 text-text">
                        <span className="flex items-center gap-2">
                          <ProductIcon categoryName={c.product?.category?.name} className="inline-block w-4 h-4 shrink-0 text-text-muted" />
                          {c.product?.name ?? c.freeText ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <Badge tone={TYPE_TONE[c.type]}>{TYPE_LABEL[c.type]}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1.5 text-text-muted">
                          <Avatar label={who.slice(0, 1).toUpperCase()} />
                          {who}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-text">{formatARS(importe)}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-text-faint">
                        {marginPct !== null ? `${marginPct.toFixed(0)}%` : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
          <TableFoot>
            <span>
              {recent.length} de {summary.consumptions.length} consumiciones de hoy
            </span>
          </TableFoot>
        </div>
      </Card>
    </div>
  );
}

function weekdayName(date: Date) {
  return date.toLocaleDateString("es-AR", { weekday: "long" });
}
