import { prisma } from "@/lib/prisma";
import { getOrCreateOpenMonth } from "@/lib/glassware";
import { PageHeader } from "@/components/ui";
import { CristaleriaTable } from "./CristaleriaTable";

export default async function CristaleriaPage() {
  const venue = await prisma.venue.findFirstOrThrow();
  const monthPeriod = await getOrCreateOpenMonth(venue.id);

  const weeks = await prisma.glasswareWeekEntry.findMany({
    where: { monthPeriodId: monthPeriod.id },
    orderBy: { weekNumber: "asc" },
    include: { counts: true },
  });

  const items = await prisma.glasswareItem.findMany({
    where: { venueId: venue.id, isActive: true },
    orderBy: [{ location: "asc" }, { sortOrder: "asc" }, { code: "asc" }],
  });

  function toRow(item: (typeof items)[number]) {
    const counts: Record<string, number | null> = {};
    for (const w of weeks) {
      const c = w.counts.find((c) => c.itemId === item.id);
      counts[w.id] = c ? c.countedQuantity : null;
    }
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      stockBase: item.stockBase,
      counts,
    };
  }

  const barraItems = items.filter((i) => i.location === "BARRA").map(toRow);
  const depositoItems = items.filter((i) => i.location === "DEPOSITO").map(toRow);

  return (
    <div>
      <PageHeader
        title="Cristalería y Vajilla"
        subtitle="Control semanal por ubicación — se acumula en un reporte mensual imprimible"
      />
      <CristaleriaTable
        venueId={venue.id}
        monthPeriodId={monthPeriod.id}
        monthLabel={monthPeriod.label}
        weeks={weeks.map((w) => ({ id: w.id, weekNumber: w.weekNumber, label: w.label }))}
        barraItems={barraItems}
        depositoItems={depositoItems}
      />
    </div>
  );
}
