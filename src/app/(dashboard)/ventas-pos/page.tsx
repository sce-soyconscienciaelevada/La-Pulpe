import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { getOpenPeriod } from "@/lib/ventas-pos";
import { VentasPosClient } from "./VentasPosClient";
import Link from "next/link";
import { Card } from "@/components/ui";

export default async function VentasPosPage() {
  const venue = await prisma.venue.findFirstOrThrow();
  const openPeriod = await getOpenPeriod(venue.id);

  const closedPeriods = await prisma.posSalesPeriod.findMany({
    where: { venueId: venue.id, status: "CLOSED" },
    orderBy: { endAt: "desc" },
    take: 20,
  });

  const products = await prisma.product.findMany({
    where: { venueId: venue.id },
    select: { id: true, name: true, posCode: true },
    orderBy: { name: "asc" },
  });

  let categories: Awaited<ReturnType<typeof loadCategories>> = [];
  if (openPeriod) {
    categories = await loadCategories(openPeriod.id);
  }

  return (
    <div>
      <PageHeader
        title="Ventas POS"
        subtitle="Comparación semanal de ventas — transcripción del ticket TOTALES del POS"
      />
      <div className="space-y-5">
        <VentasPosClient
          venueId={venue.id}
          openPeriod={openPeriod ? { id: openPeriod.id, label: openPeriod.label, totalUnidades: openPeriod.totalUnidades } : null}
          categories={categories}
          products={products}
        />

        {closedPeriods.length > 0 && (
          <Card>
            <h3 className="font-semibold text-text mb-3">Períodos anteriores</h3>
            <div className="space-y-1">
              {closedPeriods.map((p) => (
                <Link
                  key={p.id}
                  href={`/ventas-pos/${p.id}`}
                  className="block text-sm text-accent underline"
                >
                  {p.label}
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

async function loadCategories(periodId: string) {
  const cats = await prisma.posSalesCategory.findMany({
    where: { periodId },
    orderBy: { sortOrder: "asc" },
    include: { lines: { include: { product: true }, orderBy: { createdAt: "asc" } } },
  });
  return cats.map((c) => ({
    id: c.id,
    name: c.name,
    totalTicket: c.totalTicket,
    lines: c.lines.map((l) => ({
      id: l.id,
      posCode: l.posCode,
      descripcion: l.descripcion,
      unidadesVendidas: l.unidadesVendidas,
      productId: l.productId,
      productName: l.product?.name ?? null,
    })),
  }));
}
