import { prisma } from "@/lib/prisma";
import { getOrCreateBusinessDay, getDaySummary } from "@/lib/register/day";
import { computePricing } from "@/lib/pricing";
import { PageHeader, Card, StatTile, formatARS, Badge } from "@/components/ui";
import Link from "next/link";

export default async function InicioPage() {
  const venue = await prisma.venue.findFirstOrThrow();
  const day = await getOrCreateBusinessDay(venue.id);
  const summary = await getDaySummary(day.id);

  const lowStock = await prisma.product.findMany({
    where: {
      venueId: venue.id,
      reorderThreshold: { not: null },
    },
  });
  const lowStockFiltered = lowStock.filter(
    (p) => p.reorderThreshold !== null && p.currentStock <= p.reorderThreshold
  );

  const sellableProducts = await prisma.product.findMany({
    where: { venueId: venue.id, isSellable: true, salePricePerServing: { not: null } },
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

  return (
    <div>
      <PageHeader title="Inicio" subtitle={new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatTile label="Ventas del día" value={formatARS(summary.revenue)} />
        <StatTile label="Ganancia del día" value={formatARS(summary.profit)} tone={summary.profit >= 0 ? "profit" : "loss"} />
        <StatTile label="Consumo dueños/cortesía" value={formatARS(summary.byType.OWNER.reduce((s,c)=>s+c.quantity*c.unitCost,0) + summary.byType.COMP.reduce((s,c)=>s+c.quantity*c.unitCost,0))} tone="comp" />
        <StatTile label="Tragos servidos hoy" value={String(summary.consumptions.length)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-semibold text-text mb-3">Top tragos por rentabilidad</h2>
          {topByMargin.length === 0 ? (
            <p className="text-sm text-text-muted">
              Sin precios de venta cargados todavía —{" "}
              <Link href="/precios" className="text-accent underline">
                cargalos en Precios & Rentabilidad
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-2">
              {topByMargin.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-text">{p.emoji} {p.name}</span>
                  <Badge tone="profit">{p.pricing.marginPercent?.toFixed(0)}% margen</Badge>
                </li>
              ))}
            </ul>
          )}
          {withoutPrice > 0 && (
            <p className="text-xs text-text-muted mt-3">
              {withoutPrice} productos sin precio de venta cargado.
            </p>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold text-text mb-3">Alertas de stock bajo</h2>
          {lowStockFiltered.length === 0 ? (
            <p className="text-sm text-text-muted">Sin alertas — definí umbrales en Productos para activarlas.</p>
          ) : (
            <ul className="space-y-2">
              {lowStockFiltered.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-text">{p.emoji} {p.name}</span>
                  <Badge tone="loss">{p.currentStock.toFixed(1)} / mín. {p.reorderThreshold}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-4">
        <Link href="/registro" className="inline-block bg-accent text-bg font-semibold rounded-lg px-5 py-3">
          Ir al Registro diario →
        </Link>
      </div>
    </div>
  );
}
