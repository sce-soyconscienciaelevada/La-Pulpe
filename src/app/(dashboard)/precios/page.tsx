import { prisma } from "@/lib/prisma";
import { computePricing } from "@/lib/pricing";
import { PageHeader } from "@/components/ui";
import { PreciosTable } from "./PreciosTable";

export default async function PreciosPage() {
  const venue = await prisma.venue.findFirstOrThrow();
  const products = await prisma.product.findMany({
    where: { venueId: venue.id, isSellable: true },
    orderBy: { name: "asc" },
    include: { category: true },
  });

  const rows = products.map((p) => {
    const pricing = computePricing({
      costPricePerContainer: p.costPricePerContainer,
      servingsPerContainer: p.servingsPerContainer,
      salePricePerServing: p.salePricePerServing,
    });
    return {
      id: p.id,
      name: p.name,
      categoryName: p.category?.name ?? null,
      costPricePerContainer: p.costPricePerContainer,
      costPerServing: pricing.costPerServing,
      salePricePerServing: p.salePricePerServing,
      profitPerServing: pricing.profitPerServing,
      marginPercent: pricing.marginPercent,
    };
  });

  const missing = rows.filter((r) => r.salePricePerServing === null).length;

  return (
    <div>
      <PageHeader
        title="Precios & Rentabilidad"
        subtitle={
          missing > 0
            ? `${missing} de ${rows.length} productos sin precio de venta. Cargalo abajo (ej: bottle $20 ÷ 12.5 medidas = $1.60 costo/medida)`
            : "Ordenado por margen: peor primero"
        }
      />
      <PreciosTable rows={rows} />
    </div>
  );
}
