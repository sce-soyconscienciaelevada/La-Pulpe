import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Table, Badge } from "@/components/ui";
import { resolvePreviousPeriod } from "@/lib/ventas-pos";
import { periodLengthDays, formatShare } from "@/lib/ventas-pos-shared";
import { notFound } from "next/navigation";

export default async function VentasPosPeriodPage({
  params,
}: {
  params: Promise<{ periodId: string }>;
}) {
  const { periodId } = await params;

  const period = await prisma.posSalesPeriod.findUnique({
    where: { id: periodId },
    include: { categories: { include: { lines: true }, orderBy: { sortOrder: "asc" } } },
  });
  if (!period) notFound();

  const previous = await resolvePreviousPeriod(period.venueId, period.startAt, period.id);
  const previousFull = previous
    ? await prisma.posSalesPeriod.findUnique({
        where: { id: previous.id },
        include: { categories: { include: { lines: true } } },
      })
    : null;

  const grandTotal = period.categories.reduce(
    (s, c) => s + c.lines.reduce((ss, l) => ss + l.unidadesVendidas, 0),
    0
  );
  const days = periodLengthDays(period.startAt, period.endAt);
  const perDay = grandTotal / days;

  const prevGrandTotal = previousFull
    ? previousFull.categories.reduce((s, c) => s + c.lines.reduce((ss, l) => ss + l.unidadesVendidas, 0), 0)
    : null;
  const prevDays = previousFull ? periodLengthDays(previousFull.startAt, previousFull.endAt) : null;
  const prevPerDay = previousFull && prevDays ? prevGrandTotal! / prevDays : null;

  // Top products, ranked, with rank movement vs previous period.
  const allLines = period.categories.flatMap((c) => c.lines);
  const ranked = [...allLines].sort((a, b) => b.unidadesVendidas - a.unidadesVendidas).slice(0, 15);
  const prevRanked = previousFull
    ? [...previousFull.categories.flatMap((c) => c.lines)].sort((a, b) => b.unidadesVendidas - a.unidadesVendidas)
    : [];

  function prevRankOf(posCode: string) {
    const idx = prevRanked.findIndex((l) => l.posCode === posCode);
    return idx === -1 ? null : idx + 1;
  }

  return (
    <div>
      <PageHeader title={period.label} subtitle="Detalle del período — Ventas POS" />
      <div className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <Card>
            <div className="text-xs uppercase tracking-wide text-text-muted mb-1">Total unidades</div>
            <div className="text-2xl font-bold text-text">{grandTotal}</div>
          </Card>
          <Card>
            <div className="text-xs uppercase tracking-wide text-text-muted mb-1">Unidades / día</div>
            <div className="text-2xl font-bold text-text">{perDay.toFixed(1)}</div>
            {prevPerDay !== null && (
              <div className="text-xs text-text-muted mt-1">
                anterior: {prevPerDay.toFixed(1)} ({perDay >= prevPerDay ? "▲" : "▼"})
              </div>
            )}
          </Card>
          <Card>
            <div className="text-xs uppercase tracking-wide text-text-muted mb-1">vs. período anterior</div>
            <div className="text-sm text-text">{previousFull ? previousFull.label : "sin período anterior"}</div>
          </Card>
        </div>

        <Card>
          <h3 className="font-semibold text-text mb-3">Participación por categoría</h3>
          <Table>
            <thead>
              <tr className="text-left text-xs text-text-muted border-b border-border">
                <th className="px-3 py-2">Categoría</th>
                <th className="px-3 py-2">Unidades</th>
                <th className="px-3 py-2">% del total</th>
                <th className="px-3 py-2">% período anterior</th>
              </tr>
            </thead>
            <tbody>
              {period.categories.map((cat) => {
                const catTotal = cat.lines.reduce((s, l) => s + l.unidadesVendidas, 0);
                const prevCat = previousFull?.categories.find((c) => c.name === cat.name);
                const prevCatTotal = prevCat ? prevCat.lines.reduce((s, l) => s + l.unidadesVendidas, 0) : null;
                return (
                  <tr key={cat.id} className="border-b border-border">
                    <td className="px-3 py-2 text-text">{cat.name}</td>
                    <td className="px-3 py-2 text-text">{catTotal}</td>
                    <td className="px-3 py-2 text-text-muted">{formatShare(catTotal, grandTotal)}</td>
                    <td className="px-3 py-2 text-text-muted">
                      {prevCatTotal !== null && prevGrandTotal ? formatShare(prevCatTotal, prevGrandTotal) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>

        <Card>
          <h3 className="font-semibold text-text mb-3">Top productos</h3>
          <Table>
            <thead>
              <tr className="text-left text-xs text-text-muted border-b border-border">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Descripción</th>
                <th className="px-3 py-2">Unidades</th>
                <th className="px-3 py-2">Movimiento</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((line, idx) => {
                const prevRank = prevRankOf(line.posCode);
                const rank = idx + 1;
                let movement = <span className="text-text-muted">nuevo</span>;
                if (prevRank !== null) {
                  if (prevRank > rank) movement = <Badge tone="profit">▲ subió</Badge>;
                  else if (prevRank < rank) movement = <Badge tone="loss">▼ bajó</Badge>;
                  else movement = <Badge>= igual</Badge>;
                }
                return (
                  <tr key={line.id} className="border-b border-border">
                    <td className="px-3 py-2 text-text-muted">{rank}</td>
                    <td className="px-3 py-2 text-text">{line.descripcion}</td>
                    <td className="px-3 py-2 text-text">{line.unidadesVendidas}</td>
                    <td className="px-3 py-2">{movement}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>

        <a
          href={`/api/reportes/ventas-pos?periodId=${period.id}`}
          target="_blank"
          rel="noreferrer"
          className="inline-block rounded-lg bg-accent text-bg font-semibold px-4 py-2 text-sm"
        >
          🖨️ Imprimir reporte
        </a>
      </div>
    </div>
  );
}
