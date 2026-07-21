export const runtime = "nodejs";

import { Document, Page, Text, View, pdf, StyleSheet } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { getOrCreateOpenMonth } from "@/lib/glassware";
import { requireAdmin } from "@/lib/require-admin";

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 8, fontFamily: "Helvetica", color: "#1c202a" },
  title: { fontSize: 16, fontWeight: 700, textAlign: "center" },
  subtitle: { fontSize: 9, textAlign: "center", color: "#666", marginBottom: 4 },
  monthLabel: { fontSize: 9, textAlign: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 10, fontWeight: 700, backgroundColor: "#1c202a", color: "#fff", padding: 4, marginBottom: 4 },
  row: { flexDirection: "row", borderBottom: "0.5px solid #ccc" },
  headerRow: { flexDirection: "row", backgroundColor: "#eee", fontWeight: 700, borderBottom: "1px solid #999" },
  cellCode: { width: 45, padding: 3 },
  cellName: { width: 130, padding: 3 },
  cellBase: { width: 45, padding: 3, textAlign: "center" },
  cellWeek: { width: 40, padding: 3, textAlign: "center" },
  cellDiff: { width: 40, padding: 3, textAlign: "center" },
  section: { marginBottom: 18 },
  obsBox: { border: "1px solid #999", height: 50, marginTop: 8, padding: 4 },
  obsLabel: { fontSize: 8, color: "#666", marginBottom: 12 },
  signRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 30 },
  signLine: { width: 200, borderTop: "1px solid #333", textAlign: "center", paddingTop: 4, fontSize: 8 },
});

export async function GET() {
  await requireAdmin();
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

  function countFor(itemId: string, weekId: string) {
    const w = weeks.find((w) => w.id === weekId);
    const c = w?.counts.find((c) => c.itemId === itemId);
    return c ? c.countedQuantity : null;
  }

  function diffFor(itemId: string, stockBase: number, weekIndex: number) {
    const current = countFor(itemId, weeks[weekIndex].id);
    if (current === null) return "—";
    const previous = weekIndex === 0 ? stockBase : countFor(itemId, weeks[weekIndex - 1].id);
    if (previous === null) return "—";
    return String(previous - current);
  }

  function Section({ title, location }: { title: string; location: "BARRA" | "DEPOSITO" }) {
    const rows = items.filter((i) => i.location === location);
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.headerRow}>
          <Text style={styles.cellCode}>Código</Text>
          <Text style={styles.cellName}>Producto</Text>
          <Text style={styles.cellBase}>Stock Base</Text>
          {weeks.map((w) => (
            <Text key={w.id} style={{ width: 80, padding: 3, textAlign: "center" }}>
              {w.label}
            </Text>
          ))}
        </View>
        {weeks.length > 0 && (
          <View style={styles.headerRow}>
            <Text style={styles.cellCode}></Text>
            <Text style={styles.cellName}></Text>
            <Text style={styles.cellBase}></Text>
            {weeks.map((w) => (
              <View key={w.id} style={{ flexDirection: "row", width: 80 }}>
                <Text style={styles.cellWeek}>Conteo</Text>
                <Text style={styles.cellDiff}>Dif.</Text>
              </View>
            ))}
          </View>
        )}
        {rows.map((item) => (
          <View key={item.id} style={styles.row}>
            <Text style={styles.cellCode}>{item.code}</Text>
            <Text style={styles.cellName}>{item.name}</Text>
            <Text style={styles.cellBase}>{item.stockBase}</Text>
            {weeks.map((w, idx) => (
              <View key={w.id} style={{ flexDirection: "row", width: 80 }}>
                <Text style={styles.cellWeek}>{countFor(item.id, w.id) ?? "—"}</Text>
                <Text style={styles.cellDiff}>{diffFor(item.id, item.stockBase, idx)}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  }

  const doc = (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>{venue.name.toUpperCase()}</Text>
        <Text style={styles.subtitle}>Control de Cristalería y Vajilla</Text>
        <Text style={styles.monthLabel}>Control Mensual de Stock — {monthPeriod.label}</Text>

        <Section title="1. Barra — Cristalería y Vajilla" location="BARRA" />
        <Section title="2. Depósito — Cristalería y Vajilla" location="DEPOSITO" />

        <Text style={styles.obsLabel}>Observaciones e incidencias:</Text>
        <View style={styles.obsBox} />

        <View style={styles.signRow}>
          <Text style={styles.signLine}>Firma — Responsable de Barra</Text>
          <Text style={styles.signLine}>Firma — Gerencia</Text>
        </View>
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  return new Response(blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="cristaleria-${monthPeriod.label.replace(" ", "-")}.pdf"`,
    },
  });
}
