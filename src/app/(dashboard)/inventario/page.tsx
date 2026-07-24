import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { InventarioList } from "./InventarioList";

export default async function InventarioPage() {
  const venue = await prisma.venue.findFirstOrThrow();
  const products = await prisma.product.findMany({
    where: { venueId: venue.id },
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
  });
  const categories = await prisma.category.findMany({
    where: { venueId: venue.id },
    orderBy: { sortOrder: "asc" },
  });

  const rows = products.map((p) => ({
    id: p.id,
    name: p.name,
    emoji: p.emoji,
    containerLabel: p.containerLabel,
    currentStock: p.currentStock,
    reorderThreshold: p.reorderThreshold,
    categoryName: p.category.name,
    categoryId: p.categoryId,
    servingsPerContainer: p.servingsPerContainer,
    costPricePerContainer: p.costPricePerContainer,
    salePricePerServing: p.salePricePerServing,
  }));

  return (
    <div>
      <PageHeader
        title="Inventario"
        subtitle={`${products.length} productos — stock en vivo, ajustá con +/− sin abrir un período`}
      />
      <InventarioList
        products={rows}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
