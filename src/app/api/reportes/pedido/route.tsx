export const runtime = "nodejs";

import { Document, Page, Text, View, pdf } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { styles, ReportHeader } from "@/lib/pdf/theme";

export async function GET() {
  await requireAdmin();
  const venue = await prisma.venue.findFirstOrThrow();
  const items = await prisma.reorderItem.findMany({
    where: { venueId: venue.id, status: { not: "RECIBIDO" } },
    include: { supplier: true },
    orderBy: { createdAt: "asc" },
  });

  const grouped = new Map<string, typeof items>();
  for (const item of items) {
    const key = item.supplierLabel ?? item.supplier?.name ?? "Sin proveedor";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  }

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <ReportHeader
          title="Pedido a proveedores"
          subtitle={new Date().toLocaleDateString("es-AR")}
          venueName={venue.name}
        />
        {Array.from(grouped.entries()).map(([supplier, rows]) => (
          <View key={supplier} style={styles.section}>
            <Text style={styles.sectionTitle}>{supplier}</Text>
            <View style={styles.rowHeader}>
              <Text style={styles.cell}>Ítem</Text>
              <Text style={styles.cellRight}>Cantidad</Text>
              <Text style={styles.cellRight}>Estado</Text>
            </View>
            {rows.map((r) => (
              <View key={r.id} style={styles.row}>
                <Text style={styles.cell}>{r.name}</Text>
                <Text style={styles.cellRight}>{r.quantity}</Text>
                <Text style={styles.cellRight}>{r.status}</Text>
              </View>
            ))}
          </View>
        ))}
        {items.length === 0 && <Text>Sin pedidos pendientes.</Text>}
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  return new Response(blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="pedido-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
