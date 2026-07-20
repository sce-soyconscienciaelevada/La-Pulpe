import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Table, Badge } from "@/components/ui";

export default async function ProductosPage() {
  const venue = await prisma.venue.findFirstOrThrow();
  const products = await prisma.product.findMany({
    where: { venueId: venue.id },
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
  });

  return (
    <div>
      <PageHeader title="Productos" subtitle={`${products.length} productos en el catálogo`} />
      <Link
        href="/productos/nuevo"
        className="inline-block mb-4 rounded-lg bg-accent text-bg font-semibold px-4 py-2.5 text-sm"
      >
        + Nuevo producto
      </Link>
      <Table>
        <thead>
          <tr className="text-left text-xs text-text-muted border-b border-border">
            <th className="px-3 py-2">Producto</th>
            <th className="px-3 py-2">Categoría</th>
            <th className="px-3 py-2">Envase</th>
            <th className="px-3 py-2">Precio venta</th>
            <th className="px-3 py-2">Grilla rápida</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-border">
              <td className="px-3 py-2">
                <Link href={`/productos/${p.id}`} className="text-text hover:text-accent">
                  {p.emoji} {p.name}
                </Link>
              </td>
              <td className="px-3 py-2 text-text-muted">{p.category.name}</td>
              <td className="px-3 py-2 text-text-muted">{p.containerLabel ?? "—"}</td>
              <td className="px-3 py-2 text-text-muted">
                {p.salePricePerServing !== null ? `$${p.salePricePerServing}` : <Badge tone="loss">sin precio</Badge>}
              </td>
              <td className="px-3 py-2">{p.showOnQuickGrid && <Badge tone="accent">sí</Badge>}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
