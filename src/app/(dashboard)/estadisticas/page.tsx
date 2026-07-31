import { prisma } from "@/lib/prisma";
import { PageHeader, Card, formatARS } from "@/components/ui";
import { ProductIcon } from "@/components/ProductIcon";

export default async function EstadisticasPage() {
  const venue = await prisma.venue.findFirstOrThrow();
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const consumptions = await prisma.consumption.findMany({
    where: { venueId: venue.id, createdAt: { gte: since } },
    include: { product: { include: { category: true } }, businessDay: true },
  });

  const salesByProduct = new Map<
    string,
    { name: string; categoryName: string | null; qty: number; revenue: number }
  >();
  for (const c of consumptions.filter((c) => c.type === "SALE")) {
    const key = c.productId ?? c.freeText ?? "otro";
    const name = c.product?.name ?? c.freeText ?? "Otro";
    const existing =
      salesByProduct.get(key) ?? { name, categoryName: c.product?.category?.name ?? null, qty: 0, revenue: 0 };
    existing.qty += c.quantity;
    existing.revenue += c.quantity * c.unitPriceCharged;
    salesByProduct.set(key, existing);
  }
  const topSellers = Array.from(salesByProduct.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);
  const maxQty = topSellers[0]?.qty ?? 1;

  const byDay = new Map<string, { revenue: number; profit: number }>();
  for (const c of consumptions) {
    const key = c.businessDay.date.toISOString().slice(0, 10);
    const existing = byDay.get(key) ?? { revenue: 0, profit: 0 };
    if (c.type === "SALE") existing.revenue += c.quantity * c.unitPriceCharged;
    existing.profit += c.quantity * (c.unitPriceCharged - c.unitCost);
    byDay.set(key, existing);
  }
  const days = Array.from(byDay.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));

  const mix = {
    SALE: consumptions.filter((c) => c.type === "SALE").reduce((s, c) => s + c.quantity, 0),
    OWNER: consumptions.filter((c) => c.type === "OWNER").reduce((s, c) => s + c.quantity, 0),
    COMP: consumptions.filter((c) => c.type === "COMP").reduce((s, c) => s + c.quantity, 0),
    BAND_ALLOWANCE: consumptions.filter((c) => c.type === "BAND_ALLOWANCE").reduce((s, c) => s + c.quantity, 0),
  };
  const totalMix = mix.SALE + mix.OWNER + mix.COMP + mix.BAND_ALLOWANCE || 1;

  return (
    <div>
      <PageHeader title="Estadísticas" subtitle="Últimos 30 días" />

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <h2 className="font-semibold text-text mb-3">Más vendidos</h2>
          {topSellers.length === 0 ? (
            <p className="text-sm text-text-muted">Sin ventas registradas todavía.</p>
          ) : (
            <div className="space-y-2">
              {topSellers.map((s) => (
                <div key={s.name}>
                  <div className="flex justify-between text-sm text-text mb-0.5">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <ProductIcon categoryName={s.categoryName} className="inline-block w-4 h-4 shrink-0 text-text-muted" />
                      <span className="truncate">{s.name}</span>
                    </span>
                    <span>{s.qty}</span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${(s.qty / maxQty) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold text-text mb-3">Mezcla de consumo</h2>
          <div className="space-y-2 text-sm">
            <MixRow label="Venta" value={mix.SALE} total={totalMix} tone="accent" />
            <MixRow label="Dueños" value={mix.OWNER} total={totalMix} tone="loss" />
            <MixRow label="Cortesía" value={mix.COMP} total={totalMix} tone="profit" />
            <MixRow label="Banda" value={mix.BAND_ALLOWANCE} total={totalMix} tone="comp" />
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="font-semibold text-text mb-3">Ventas y ganancia por día</h2>
        {days.length === 0 ? (
          <p className="text-sm text-text-muted">Sin datos todavía.</p>
        ) : (
          <div className="space-y-1.5">
            {days.slice(0, 14).map(([date, d]) => (
              <div key={date} className="flex justify-between text-sm">
                <span className="text-text-muted">{date}</span>
                <span className="text-text">{formatARS(d.revenue)}</span>
                <span className={d.profit >= 0 ? "text-profit" : "text-loss"}>{formatARS(d.profit)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function MixRow({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: "accent" | "loss" | "profit" | "comp";
}) {
  const pct = (value / total) * 100;
  const colorMap = { accent: "bg-accent", loss: "bg-loss", profit: "bg-profit", comp: "bg-comp" };
  return (
    <div>
      <div className="flex justify-between text-text mb-0.5">
        <span>{label}</span>
        <span>{value.toFixed(0)} ({pct.toFixed(0)}%)</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div className={`h-full ${colorMap[tone]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
