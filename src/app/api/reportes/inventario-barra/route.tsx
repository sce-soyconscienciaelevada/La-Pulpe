export const runtime = "nodejs";

import { Document, Page, Text, View, pdf, StyleSheet } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { getWeekDates, dateKey, formatWeekLabel, DAY_LABELS } from "@/lib/fridge-shared";
import { computeFinalTeorico, formatClosedOpenCompact } from "@/lib/bar-inventory";

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 7, fontFamily: "Helvetica", color: "#1c202a" },
  title: { fontSize: 16, fontWeight: 700, textAlign: "center" },
  subtitle: { fontSize: 9, textAlign: "center", color: "#666", marginBottom: 4 },
  weekLabel: { fontSize: 9, textAlign: "center", marginBottom: 12 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 9, fontWeight: 700, backgroundColor: "#1c202a", color: "#fff", padding: 3, marginBottom: 3 },
  headerRow: { flexDirection: "row", backgroundColor: "#eee", fontWeight: 700, borderBottom: "1px solid #999" },
  row: { flexDirection: "row", borderBottom: "0.5px solid #ccc" },
  cellProduct: { width: 135, padding: 2 },
  cellDay: { width: 55, padding: 2, textAlign: "center" },
});

export async function GET(request: Request) {
  await requireAdmin();
  const venue = await prisma.venue.findFirstOrThrow();
  const { searchParams } = new URL(request.url);
  const weekParam = searchParams.get("week");
  const anchor = weekParam ? new Date(`${weekParam}T00:00:00`) : new Date();
  const weekDates = getWeekDates(anchor);

  const businessDays = await prisma.businessDay.findMany({
    where: { venueId: venue.id, date: { gte: weekDates[0], lte: weekDates[6] } },
  });
  const businessDayByDate = new Map(businessDays.map((bd) => [dateKey(bd.date), bd]));

  const products = await prisma.product.findMany({
    where: { venueId: venue.id, countingServingsPerContainer: { not: null } },
    include: { category: true },
    orderBy: { category: { sortOrder: "asc" } },
  });

  const entries = await prisma.barInventoryEntry.findMany({
    where: { businessDayId: { in: businessDays.map((bd) => bd.id) } },
  });

  function entryFor(productId: string, day: Date) {
    const bd = businessDayByDate.get(dateKey(day));
    if (!bd) return null;
    return entries.find((e) => e.businessDayId === bd.id && e.productId === productId) ?? null;
  }

  const groups = new Map<string, typeof products>();
  for (const p of products) {
    if (!groups.has(p.category.name)) groups.set(p.category.name, []);
    groups.get(p.category.name)!.push(p);
  }

  const doc = (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>{venue.name.toUpperCase()}</Text>
        <Text style={styles.subtitle}>Inventario de Barra — Sistema de Puntos</Text>
        <Text style={styles.weekLabel}>Semana {formatWeekLabel(weekDates)}</Text>
        <Text style={styles.weekLabel}>N = piezas cerradas. N+X/T = N cerradas más una abierta marcada en X de sus T puntos configurados (T junto al nombre).</Text>

        {Array.from(groups.entries()).map(([categoryName, items]) => (
          <View key={categoryName} style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>{categoryName}</Text>
            <View style={styles.headerRow}>
              <Text style={styles.cellProduct}>Producto</Text>
              {weekDates.map((d, i) => (
                <Text key={dateKey(d)} style={styles.cellDay}>{DAY_LABELS[i]}</Text>
              ))}
              <Text style={styles.cellDay}>Existencia</Text>
            </View>
            {items.map((product) => (
              <View key={product.id} style={styles.row}>
                <Text style={styles.cellProduct}>
                  {product.name} (T={product.countingServingsPerContainer})
                </Text>
                {weekDates.map((day) => {
                  const e = entryFor(product.id, day);
                  const teorico = e ? computeFinalTeorico(e.initialQuantity, e.entradas, e.ventaPunto) : null;
                  return (
                    <Text key={dateKey(day)} style={styles.cellDay}>
                      {teorico !== null
                        ? formatClosedOpenCompact(teorico, product.countingServingsPerContainer ?? 10)
                        : "—"}
                    </Text>
                  );
                })}
                <Text style={styles.cellDay}>
                  {(() => {
                    const last = entryFor(product.id, weekDates[6]);
                    return last?.countedPhysical !== null && last?.countedPhysical !== undefined
                      ? formatClosedOpenCompact(last.countedPhysical, product.countingServingsPerContainer ?? 10)
                      : "—";
                  })()}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  return new Response(blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="inventario-barra-${dateKey(weekDates[0])}.pdf"`,
    },
  });
}
