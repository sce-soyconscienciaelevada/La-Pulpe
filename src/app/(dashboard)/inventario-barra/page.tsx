import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { getOrCreateBusinessDay } from "@/lib/register/day";
import { ensureTodayEntries } from "@/lib/bar-inventory";
import { InventarioBarraTable } from "./InventarioBarraTable";
import { ColumnGlossary } from "./ColumnGlossary";

export default async function InventarioBarraPage() {
  const venue = await prisma.venue.findFirstOrThrow();
  const businessDay = await getOrCreateBusinessDay(venue.id);
  await ensureTodayEntries(venue.id, businessDay.id);

  const entries = await prisma.barInventoryEntry.findMany({
    where: { businessDayId: businessDay.id },
    include: { product: { include: { category: true } } },
    orderBy: { product: { category: { sortOrder: "asc" } } },
  });

  const registroSums = await prisma.consumption.groupBy({
    by: ["productId"],
    where: { businessDayId: businessDay.id, type: "SALE", productId: { not: null } },
    _sum: { quantity: true },
  });
  const registroSumByProduct = new Map(registroSums.map((r) => [r.productId, r._sum.quantity ?? 0]));

  const rows = entries.map((e) => ({
    id: e.id,
    productId: e.productId,
    productName: e.product.name,
    categoryName: e.product.category.name,
    countingServingsPerContainer: e.product.countingServingsPerContainer,
    initialQuantity: e.initialQuantity,
    entradas: e.entradas,
    ventaPunto: e.ventaPunto,
    countedPhysical: e.countedPhysical,
    registroReference:
      e.product.countingServingsPerContainer && registroSumByProduct.has(e.productId)
        ? (registroSumByProduct.get(e.productId) ?? 0) / e.product.countingServingsPerContainer
        : null,
  }));

  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    if (!groups.has(r.categoryName)) groups.set(r.categoryName, []);
    groups.get(r.categoryName)!.push(r);
  }

  return (
    <div>
      <PageHeader
        title="Inventario de Barra"
        subtitle="Control diario de botellas abiertas — sistema de puntos, cierre de turno"
      />
      {rows.length === 0 ? (
        <p className="text-sm text-text-muted">
          Todavía no hay productos con "puntos de conteo" configurados. Configurá el campo{" "}
          <strong>Puntos de conteo</strong> en Productos para que aparezcan acá.
        </p>
      ) : (
        <>
          <ColumnGlossary />
          <p className="text-xs text-text-muted mb-3">
            Ej: "2 cerradas + abierta (7/10)" = 2 botellas selladas más una en uso, marcada en 7 de sus 10 puntos.
          </p>
          <InventarioBarraTable groups={Array.from(groups.entries()).map(([name, items]) => ({ name, items }))} />
        </>
      )}
    </div>
  );
}
