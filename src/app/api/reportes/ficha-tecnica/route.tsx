export const runtime = "nodejs";

import { Document, Page, Text, View, Image, pdf, StyleSheet } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { NextRequest } from "next/server";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#1c202a" },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 10, color: "#666", marginBottom: 14 },
  photo: { width: "100%", height: 220, objectFit: "cover", marginBottom: 14, borderRadius: 4 },
  row: { flexDirection: "row", gap: 16, marginBottom: 14 },
  col: { flex: 1 },
  label: { fontSize: 9, color: "#888", textTransform: "uppercase", marginBottom: 3 },
  value: { fontSize: 11, marginBottom: 10 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginTop: 6, marginBottom: 6, borderBottom: "1px solid #ccc", paddingBottom: 3 },
  step: { fontSize: 10, marginBottom: 4 },
  ingredient: { fontSize: 10, marginBottom: 3 },
});

export async function GET(req: NextRequest) {
  await requireAdmin();
  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) return new Response("Falta productId", { status: 400 });

  const recipe = await prisma.recipe.findUnique({
    where: { productId },
    include: { product: true, ingredients: { include: { ingredientProduct: true } } },
  });
  if (!recipe) return new Response("Receta no encontrada", { status: 404 });

  const steps = (recipe.preparationSteps ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const doc = (
    <Document>
      <Page size="A5" style={styles.page}>
        <Text style={styles.title}>
          {recipe.product.emoji} {recipe.product.name}
        </Text>
        {recipe.description && <Text style={styles.subtitle}>{recipe.description}</Text>}

        {recipe.photoUrl && <Image style={styles.photo} src={recipe.photoUrl} />}

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Vaso / copa</Text>
            <Text style={styles.value}>{recipe.glassLabel || "—"}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Guarnición</Text>
            <Text style={styles.value}>{recipe.garnish || "—"}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Ingredientes</Text>
        {recipe.ingredients.map((i) => (
          <Text key={i.id} style={styles.ingredient}>
            • {i.quantity} medida(s) de {i.ingredientProduct.name}
          </Text>
        ))}

        {steps.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Preparación</Text>
            {steps.map((s, idx) => (
              <Text key={idx} style={styles.step}>
                {idx + 1}. {s}
              </Text>
            ))}
          </>
        )}
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  return new Response(blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="ficha-tecnica-${recipe.product.name.replace(/\s+/g, "-")}.pdf"`,
    },
  });
}
