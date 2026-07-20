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

  const rows = products.map((p) => ({
    id: p.id,
    name: p.name,
    emoji: p.emoji,
    containerLabel: p.containerLabel,
    currentStock: p.currentStock,
    reorderThreshold: p.reorderThreshold,
    categoryName: p.category.name,
  }));

  return (
    <div>
      <PageHeader
        title="Inventario"
        subtitle={`${products.length} productos — stock en vivo, ajustá con +/− sin abrir un período`}
      />
      <InventarioList products={rows} />
    </div>
  );
}
