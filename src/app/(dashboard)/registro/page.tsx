import { prisma } from "@/lib/prisma";
import { getOrCreateBusinessDay, getDaySummary } from "@/lib/register/day";
import { PageHeader } from "@/components/ui";
import { RegistroTabs } from "./RegistroTabs";

export default async function RegistroPage() {
  const venue = await prisma.venue.findFirstOrThrow();
  const day = await getOrCreateBusinessDay(venue.id);
  const summary = await getDaySummary(day.id);

  const quickProducts = await prisma.product.findMany({
    where: { venueId: venue.id, showOnQuickGrid: true },
    orderBy: { quickGridSort: "asc" },
  });
  const owners = await prisma.person.findMany({
    where: { venueId: venue.id, kind: "OWNER", isActive: true },
    orderBy: { createdAt: "asc" },
  });
  const suppliers = await prisma.supplier.findMany({ where: { venueId: venue.id } });
  const reorderItems = await prisma.reorderItem.findMany({ where: { businessDayId: day.id } });

  return (
    <div>
      <PageHeader
        title="Registro diario"
        subtitle={new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
      />
      <RegistroTabs
        quickProducts={quickProducts.map((p) => ({
          id: p.id,
          name: p.name,
          emoji: p.emoji,
          colorHex: p.colorHex,
        }))}
        owners={owners.map((o) => ({ id: o.id, name: o.name }))}
        suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
        consumptions={summary.consumptions.map((c) => ({
          id: c.id,
          type: c.type,
          quantity: c.quantity,
          unitPriceCharged: c.unitPriceCharged,
          unitCost: c.unitCost,
          productName: c.product?.name ?? null,
          freeText: c.freeText,
          personName: c.person?.name ?? null,
        }))}
        reorderItems={reorderItems.map((r) => ({
          id: r.id,
          name: r.name,
          quantity: r.quantity,
          supplierLabel: r.supplierLabel,
        }))}
        revenue={summary.revenue}
        profit={summary.profit}
        dayStatus={day.status}
      />
    </div>
  );
}
