export const runtime = "nodejs";

import { Document, Page, Text, View, pdf, StyleSheet } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { formatShare } from "@/lib/ventas-pos-shared";

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 8, fontFamily: "Helvetica", color: "#1c202a" },
  title: { fontSize: 16, fontWeight: 700, textAlign: "center" },
  subtitle: { fontSize: 9, textAlign: "center", color: "#666", marginBottom: 4 },
  periodLabel: { fontSize: 9, textAlign: "center", marginBottom: 14 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 10, fontWeight: 700, backgroundColor: "#1c202a", color: "#fff", padding: 4, marginBottom: 4 },
  headerRow: { flexDirection: "row", backgroundColor: "#eee", fontWeight: 700, borderBottom: "1px solid #999" },
  row: { flexDirection: "row", borderBottom: "0.5px solid #ccc" },
  cellCode: { width: 45, padding: 3 },
  cellDesc: { width: 180, padding: 3 },
  cellUnits: { width: 55, padding: 3, textAlign: "right" },
  cellShare: { width: 55, padding: 3, textAlign: "right" },
  totalRow: { flexDirection: "row", borderTop: "1px solid #333", fontWeight: 700, paddingTop: 3 },
});

export async function GET(request: Request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const periodId = searchParams.get("periodId");

  const period = periodId
    ? await prisma.posSalesPeriod.findUnique({
        where: { id: periodId },
        include: { categories: { include: { lines: true }, orderBy: { sortOrder: "asc" } } },
      })
    : await prisma.posSalesPeriod.findFirst({
        where: { status: "CLOSED" },
        orderBy: { endAt: "desc" },
        include: { categories: { include: { lines: true }, orderBy: { sortOrder: "asc" } } },
      });

  const venue = await prisma.venue.findFirstOrThrow();

  if (!period) {
    const empty = (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>{venue.name.toUpperCase()}</Text>
          <Text style={styles.subtitle}>Ventas POS</Text>
          <Text>Todavía no hay ningún período cargado.</Text>
        </Page>
      </Document>
    );
    const blob = await pdf(empty).toBlob();
    return new Response(blob, { headers: { "Content-Type": "application/pdf" } });
  }

  const grandTotal = period.categories.reduce(
    (s, c) => s + c.lines.reduce((ss, l) => ss + l.unidadesVendidas, 0),
    0
  );

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{venue.name.toUpperCase()}</Text>
        <Text style={styles.subtitle}>Reporte Semanal de Venta — Ventas POS</Text>
        <Text style={styles.periodLabel}>{period.label}</Text>

        {period.categories.map((cat) => {
          const catTotal = cat.lines.reduce((s, l) => s + l.unidadesVendidas, 0);
          return (
            <View key={cat.id} style={styles.section} wrap={false}>
              <Text style={styles.sectionTitle}>
                {cat.name} ({catTotal} uds — {cat.lines.length} ítems)
              </Text>
              <View style={styles.headerRow}>
                <Text style={styles.cellCode}>Cód</Text>
                <Text style={styles.cellDesc}>Descripción</Text>
                <Text style={styles.cellUnits}>Venta</Text>
                <Text style={styles.cellShare}>% Menú</Text>
              </View>
              {cat.lines
                .slice()
                .sort((a, b) => b.unidadesVendidas - a.unidadesVendidas)
                .map((line) => (
                  <View key={line.id} style={styles.row}>
                    <Text style={styles.cellCode}>{line.posCode}</Text>
                    <Text style={styles.cellDesc}>{line.descripcion}</Text>
                    <Text style={styles.cellUnits}>{line.unidadesVendidas.toFixed(2)}</Text>
                    <Text style={styles.cellShare}>{formatShare(line.unidadesVendidas, catTotal)}</Text>
                  </View>
                ))}
            </View>
          );
        })}

        <View style={styles.totalRow}>
          <Text style={styles.cellDesc}>TOTAL VENTA</Text>
          <Text style={styles.cellUnits}>{grandTotal.toFixed(2)}</Text>
          <Text style={styles.cellShare}>unidades</Text>
        </View>
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  return new Response(blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="ventas-pos-${period.id}.pdf"`,
    },
  });
}
