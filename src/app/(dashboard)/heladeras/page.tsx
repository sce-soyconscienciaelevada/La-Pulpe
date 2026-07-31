import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { ensureFridgeUnits } from "@/lib/fridge";
import { getWeekDates, dateKey } from "@/lib/fridge-shared";
import { dateFromDateOnlyKey } from "@/lib/day-boundary";
import { HeladerasTable } from "./HeladerasTable";

export default async function HeladerasPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const venue = await prisma.venue.findFirstOrThrow();
  await ensureFridgeUnits(venue.id);

  const anchor = week ? dateFromDateOnlyKey(week) : new Date();
  const weekDates = getWeekDates(anchor);
  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];
  const rangeEnd = new Date(weekEnd);
  rangeEnd.setDate(rangeEnd.getDate() + 1);

  const units = await prisma.fridgeUnit.findMany({
    where: { venueId: venue.id, isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const entries = await prisma.fridgeTempEntry.findMany({
    where: { unit: { venueId: venue.id }, date: { gte: weekStart, lt: rangeEnd } },
  });

  const incidents = await prisma.fridgeIncident.findMany({
    where: { unit: { venueId: venue.id }, date: { gte: weekStart, lt: rangeEnd } },
    include: { responsiblePerson: true, unit: true },
    orderBy: { date: "desc" },
  });

  const people = await prisma.person.findMany({
    where: { venueId: venue.id, isActive: true },
    orderBy: { name: "asc" },
  });

  const unitRows = units.map((u) => ({
    id: u.id,
    code: u.code,
    name: u.name,
    temps: Object.fromEntries(
      weekDates.map((d) => {
        const key = dateKey(d);
        const entry = entries.find((e) => e.unitId === u.id && dateKey(e.date) === key);
        return [key, entry ? entry.tempC : null];
      })
    ),
  }));

  return (
    <div>
      <PageHeader
        title="Control Temperatura · Heladeras"
        subtitle="Registro semanal de cierre de turno"
      />
      <HeladerasTable
        weekDates={weekDates.map((d) => dateKey(d))}
        anchorKey={dateKey(anchor)}
        units={unitRows}
        incidents={incidents.map((i) => ({
          id: i.id,
          date: dateKey(i.date),
          unitCode: i.unit.code,
          unitId: i.unitId,
          tempRecorded: i.tempRecorded,
          actionTaken: i.actionTaken,
          responsibleName: i.responsiblePerson?.name ?? null,
        }))}
        people={people.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}
