import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { ComprasClient } from "./ComprasClient";

export default async function ComprasPage() {
  const venue = await prisma.venue.findFirstOrThrow();
  const products = await prisma.product.findMany({
    where: { venueId: venue.id },
    orderBy: { name: "asc" },
    include: { category: true },
  });
  const suppliers = await prisma.supplier.findMany({ where: { venueId: venue.id } });
  const reorderItems = await prisma.reorderItem.findMany({
    where: { venueId: venue.id, status: { not: "RECIBIDO" } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Compras & Pedidos" subtitle="Registrá compras y seguí el estado de lo pedido" />
      <ComprasClient
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          categoryName: p.category?.name ?? null,
          costPricePerContainer: p.costPricePerContainer,
        }))}
        suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
        reorderItems={reorderItems.map((r) => ({
          id: r.id,
          name: r.name,
          quantity: r.quantity,
          status: r.status,
          supplierLabel: r.supplierLabel,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
