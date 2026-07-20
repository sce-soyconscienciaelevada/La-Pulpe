export const runtime = "nodejs";

import { Document, Page, Text, View, pdf } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { computePricing } from "@/lib/pricing";
import { styles, ReportHeader } from "@/lib/pdf/theme";
import { formatARS } from "@/components/ui";

export async function GET() {
  await requireAdmin();
  const venue = await prisma.venue.findFirstOrThrow();
  const products = await prisma.product.findMany({
    where: { venueId: venue.id, isSellable: true },
    orderBy: { name: "asc" },
  });

  const rows = products
    .map((p) => ({
      name: p.name,
      pricing: computePricing({
        costPricePerContainer: p.costPricePerContainer,
        servingsPerContainer: p.servingsPerContainer,
        salePricePerServing: p.salePricePerServing,
      }),
    }))
    .sort((a, b) => (a.pricing.marginPercent ?? -Infinity) - (b.pricing.marginPercent ?? -Infinity));

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <ReportHeader
          title="Rentabilidad por trago"
          subtitle={`${products.length} productos — ordenado por margen`}
          venueName={venue.name}
        />
        <View style={styles.rowHeader}>
          <Text style={styles.cell}>Producto</Text>
          <Text style={styles.cellRight}>Costo/medida</Text>
          <Text style={styles.cellRight}>Venta/medida</Text>
          <Text style={styles.cellRight}>Ganancia</Text>
          <Text style={styles.cellRight}>Margen</Text>
        </View>
        {rows.map((r) => (
          <View key={r.name} style={styles.row}>
            <Text style={styles.cell}>{r.name}</Text>
            <Text style={styles.cellRight}>{formatARS(r.pricing.costPerServing)}</Text>
            <Text style={styles.cellRight}>
              {r.pricing.profitPerServing !== null ? formatARS(r.pricing.costPerServing + r.pricing.profitPerServing) : "sin precio"}
            </Text>
            <Text style={styles.cellRight}>
              {r.pricing.profitPerServing !== null ? formatARS(r.pricing.profitPerServing) : "—"}
            </Text>
            <Text style={styles.cellRight}>
              {r.pricing.marginPercent !== null ? `${r.pricing.marginPercent.toFixed(0)}%` : "—"}
            </Text>
          </View>
        ))}
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  return new Response(blob, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="rentabilidad.pdf"` },
  });
}
