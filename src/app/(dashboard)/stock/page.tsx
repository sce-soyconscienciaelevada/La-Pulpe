import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { StockCountTable } from "./StockCountTable";

export default async function StockPage() {
  const venue = await prisma.venue.findFirstOrThrow();
  const period = await prisma.stockPeriod.findFirst({
    where: { venueId: venue.id, status: "OPEN" },
    include: { counts: { include: { product: true }, orderBy: { product: { name: "asc" } } } },
    orderBy: { startDate: "desc" },
  });

  if (!period) {
    return (
      <div>
        <PageHeader title="Stock semanal" />
        <Card>
          <p className="text-sm text-text-muted">No hay un período abierto todavía.</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Stock semanal"
        subtitle={`${period.label} — contá lo que hay físicamente, la diferencia se calcula sola al cerrar`}
      />
      <StockCountTable
        periodId={period.id}
        periodLabel={period.label}
        status={period.status}
        rows={period.counts.map((c) => ({
          productId: c.productId,
          productName: c.product.name,
          emoji: c.product.emoji,
          initialQuantity: c.initialQuantity,
          countedFinalQuantity: c.countedFinalQuantity,
          variance: c.variance,
        }))}
      />
    </div>
  );
}
