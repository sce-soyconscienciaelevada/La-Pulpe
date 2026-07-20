export const runtime = "nodejs";

import { Document, Page, Text, View, pdf } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { getOrCreateBusinessDay, getDaySummary } from "@/lib/register/day";
import { requireAdmin } from "@/lib/require-admin";
import { styles, ReportHeader } from "@/lib/pdf/theme";
import { formatARS } from "@/components/ui";

export async function GET() {
  await requireAdmin();
  const venue = await prisma.venue.findFirstOrThrow();
  const day = await getOrCreateBusinessDay(venue.id);
  const summary = await getDaySummary(day.id);

  const dateLabel = day.date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <ReportHeader title="Cierre del día" subtitle={dateLabel} venueName={venue.name} />

        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Ventas</Text>
            <Text style={styles.statValue}>{formatARS(summary.revenue)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Costo (COGS)</Text>
            <Text style={styles.statValue}>{formatARS(summary.cogs)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Ganancia</Text>
            <Text style={styles.statValue}>{formatARS(summary.profit)}</Text>
          </View>
        </View>

        {(["SALE", "OWNER", "COMP", "BAND_ALLOWANCE"] as const).map((type) => {
          const items = summary.byType[type];
          const label =
            type === "SALE" ? "Consumiciones (cobradas)" : type === "OWNER" ? "Consumo dueños" : type === "COMP" ? "Cortesía" : "Bandas";
          return (
            <View key={type} style={styles.section}>
              <Text style={styles.sectionTitle}>{label}</Text>
              {items.length === 0 ? (
                <Text>Sin registros</Text>
              ) : (
                <>
                  <View style={styles.rowHeader}>
                    <Text style={styles.cell}>Producto</Text>
                    <Text style={styles.cellRight}>Cant.</Text>
                    <Text style={styles.cellRight}>Precio</Text>
                    <Text style={styles.cellRight}>Total</Text>
                  </View>
                  {items.map((i) => (
                    <View key={i.id} style={styles.row}>
                      <Text style={styles.cell}>
                        {i.product?.name ?? i.freeText} {i.person ? `(${i.person.name})` : ""}
                      </Text>
                      <Text style={styles.cellRight}>{i.quantity}</Text>
                      <Text style={styles.cellRight}>{formatARS(i.unitPriceCharged)}</Text>
                      <Text style={styles.cellRight}>{formatARS(i.quantity * i.unitPriceCharged)}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          );
        })}
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  return new Response(blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="cierre-dia-${day.date.toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
