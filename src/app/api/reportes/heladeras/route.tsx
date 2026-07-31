export const runtime = "nodejs";

import { Document, Page, Text, View, pdf, StyleSheet } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { ensureFridgeUnits } from "@/lib/fridge";
import {
  getWeekDates,
  dateKey,
  formatWeekLabel,
  computeFridgeStatus,
  FRIDGE_STATUS_LABEL,
  DAY_LABELS,
} from "@/lib/fridge-shared";
import { dateFromDateOnlyKey } from "@/lib/day-boundary";

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 8, fontFamily: "Helvetica", color: "#1c202a" },
  title: { fontSize: 16, fontWeight: 700, textAlign: "center" },
  subtitle: { fontSize: 9, textAlign: "center", color: "#666", marginBottom: 4 },
  weekLabel: { fontSize: 9, textAlign: "center", marginBottom: 14 },
  headerRow: { flexDirection: "row", backgroundColor: "#eee", fontWeight: 700, borderBottom: "1px solid #999" },
  row: { flexDirection: "row", borderBottom: "0.5px solid #ccc" },
  cellUnit: { width: 130, padding: 3 },
  cellDay: { width: 55, padding: 3, textAlign: "center" },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 10, fontWeight: 700, backgroundColor: "#1c202a", color: "#fff", padding: 4, marginBottom: 4 },
  incCellDate: { width: 60, padding: 3 },
  incCellUnit: { width: 70, padding: 3 },
  incCellTemp: { width: 50, padding: 3, textAlign: "center" },
  incCellAction: { flex: 1, padding: 3 },
  obsBox: { border: "1px solid #999", height: 50, marginTop: 8, padding: 4 },
  obsLabel: { fontSize: 8, color: "#666", marginBottom: 12 },
  signRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 30 },
  signLine: { width: 150, borderTop: "1px solid #333", textAlign: "center", paddingTop: 4, fontSize: 8 },
});

export async function GET(request: Request) {
  await requireAdmin();
  const venue = await prisma.venue.findFirstOrThrow();
  await ensureFridgeUnits(venue.id);

  const { searchParams } = new URL(request.url);
  const weekParam = searchParams.get("week");
  const anchor = weekParam ? dateFromDateOnlyKey(weekParam) : new Date();
  const weekDates = getWeekDates(anchor);
  const rangeEnd = new Date(weekDates[6]);
  rangeEnd.setDate(rangeEnd.getDate() + 1);

  const units = await prisma.fridgeUnit.findMany({
    where: { venueId: venue.id, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  const entries = await prisma.fridgeTempEntry.findMany({
    where: { unit: { venueId: venue.id }, date: { gte: weekDates[0], lt: rangeEnd } },
  });
  const incidents = await prisma.fridgeIncident.findMany({
    where: { unit: { venueId: venue.id }, date: { gte: weekDates[0], lt: rangeEnd } },
    include: { unit: true, responsiblePerson: true },
    orderBy: { date: "asc" },
  });

  function tempFor(unitId: string, day: Date) {
    const key = dateKey(day);
    const e = entries.find((e) => e.unitId === unitId && dateKey(e.date) === key);
    return e ? e.tempC : null;
  }

  const doc = (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>{venue.name.toUpperCase()}</Text>
        <Text style={styles.subtitle}>Control de Temperatura · Heladeras</Text>
        <Text style={styles.weekLabel}>Registro Semanal — {formatWeekLabel(weekDates)}</Text>

        <View style={styles.section}>
          <View style={styles.headerRow}>
            <Text style={styles.cellUnit}>Unidad</Text>
            {DAY_LABELS.map((d) => (
              <Text key={d} style={styles.cellDay}>{d}</Text>
            ))}
          </View>
          {units.map((unit) => (
            <View key={unit.id}>
              <View style={styles.row}>
                <Text style={styles.cellUnit}>{unit.code} — {unit.name}</Text>
                {weekDates.map((day) => (
                  <Text key={dateKey(day)} style={styles.cellDay}>
                    {tempFor(unit.id, day) ?? "—"}
                  </Text>
                ))}
              </View>
              <View style={styles.row}>
                <Text style={[styles.cellUnit, { color: "#666" }]}>Estado</Text>
                {weekDates.map((day) => (
                  <Text key={dateKey(day)} style={[styles.cellDay, { color: "#666" }]}>
                    {FRIDGE_STATUS_LABEL[computeFridgeStatus(tempFor(unit.id, day))]}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>¿Algo salió mal? — Registro de Incidencias</Text>
          <View style={styles.headerRow}>
            <Text style={styles.incCellDate}>Fecha</Text>
            <Text style={styles.incCellUnit}>Heladera</Text>
            <Text style={styles.incCellTemp}>Temp.</Text>
            <Text style={styles.incCellAction}>Qué se hizo / Responsable</Text>
          </View>
          {incidents.length === 0 ? (
            <View style={styles.row}>
              <Text style={[styles.incCellAction, { padding: 3 }]}>Sin incidencias esta semana.</Text>
            </View>
          ) : (
            incidents.map((inc) => (
              <View key={inc.id} style={styles.row}>
                <Text style={styles.incCellDate}>{inc.date.toLocaleDateString("es-AR")}</Text>
                <Text style={styles.incCellUnit}>{inc.unit.code}</Text>
                <Text style={styles.incCellTemp}>{inc.tempRecorded ?? "—"}</Text>
                <Text style={styles.incCellAction}>
                  {inc.actionTaken}
                  {inc.responsiblePerson ? ` — ${inc.responsiblePerson.name}` : ""}
                </Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.obsLabel}>Observaciones del período:</Text>
        <View style={styles.obsBox} />

        <View style={styles.signRow}>
          <Text style={styles.signLine}>Revisado por Encargado</Text>
          <Text style={styles.signLine}>Gerencia</Text>
          <Text style={styles.signLine}>Responsable de Área</Text>
        </View>
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  return new Response(blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="heladeras-${dateKey(weekDates[0])}.pdf"`,
    },
  });
}
