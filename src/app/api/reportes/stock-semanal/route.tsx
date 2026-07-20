export const runtime = "nodejs";

import { Document, Page, Text, View, pdf } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { styles, ReportHeader } from "@/lib/pdf/theme";

export async function GET() {
  await requireAdmin();
  const venue = await prisma.venue.findFirstOrThrow();
  const period = await prisma.stockPeriod.findFirst({
    where: { venueId: venue.id, status: "OPEN" },
    include: { counts: { include: { product: { include: { category: true } } } } },
    orderBy: { startDate: "desc" },
  });

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <ReportHeader
          title="Stock semanal"
          subtitle={period?.label ?? "Sin período abierto"}
          venueName={venue.name}
        />
        {period && (
          <View style={styles.section}>
            <View style={styles.rowHeader}>
              <Text style={styles.cell}>Producto</Text>
              <Text style={styles.cellRight}>Inicial</Text>
              <Text style={styles.cellRight}>Esperado</Text>
              <Text style={styles.cellRight}>Contado</Text>
              <Text style={styles.cellRight}>Diferencia</Text>
            </View>
            {period.counts.map((c) => (
              <View key={c.id} style={styles.row}>
                <Text style={styles.cell}>{c.product.name}</Text>
                <Text style={styles.cellRight}>{c.initialQuantity.toFixed(1)}</Text>
                <Text style={styles.cellRight}>{c.expectedFinalQuantity?.toFixed(1) ?? "—"}</Text>
                <Text style={styles.cellRight}>{c.countedFinalQuantity?.toFixed(1) ?? "—"}</Text>
                <Text style={styles.cellRight}>{c.variance?.toFixed(1) ?? "—"}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  return new Response(blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="stock-semanal.pdf"`,
    },
  });
}
