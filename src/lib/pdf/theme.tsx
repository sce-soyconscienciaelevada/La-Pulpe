import { StyleSheet, Text, View } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#1c202a" },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 10, color: "#666", marginBottom: 16 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 6, borderBottom: "1px solid #ccc", paddingBottom: 3 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottom: "0.5px solid #eee" },
  rowHeader: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, backgroundColor: "#f2f2f2", fontWeight: 700 },
  cell: { flex: 1 },
  cellRight: { flex: 1, textAlign: "right" },
  statRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  statBox: { flex: 1, border: "1px solid #ddd", borderRadius: 4, padding: 8 },
  statLabel: { fontSize: 8, color: "#888", textTransform: "uppercase", marginBottom: 2 },
  statValue: { fontSize: 14, fontWeight: 700 },
});

export function ReportHeader({ title, subtitle, venueName }: { title: string; subtitle: string; venueName: string }) {
  return (
    <View>
      <Text style={styles.title}>{venueName}</Text>
      <Text style={styles.subtitle}>
        {title} · {subtitle}
      </Text>
    </View>
  );
}
