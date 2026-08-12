export const runtime = "nodejs";

import { Document, Page, Text, View, Image, pdf, StyleSheet } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { computePricing } from "@/lib/pricing";
import { NextRequest } from "next/server";

const NAVY = "#1c2c56";
const NAVY_2 = "#24345c";
const ROW_TEXT = "#3a4f7a";
const RULE = "#f0c4b4";
const LABEL_BLUE = "#7c9fc4";
const METHOD_PINK = "#c23b8f";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: NAVY_2 },
  eyebrow: { fontSize: 9, fontWeight: 700, letterSpacing: 1.2, color: LABEL_BLUE, textTransform: "uppercase" },
  title: { fontSize: 22, fontWeight: 700, color: NAVY, marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#666", marginBottom: 14 },
  photo: { width: "100%", height: 140, objectFit: "cover", marginBottom: 14, borderRadius: 4 },
  topRow: { flexDirection: "row", gap: 16, marginBottom: 16 },
  col: { flex: 1 },
  label: { fontSize: 9, color: ROW_TEXT, marginBottom: 2 },
  value: { fontSize: 11, fontWeight: 700, color: NAVY },

  h2: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: NAVY, marginBottom: 8 },

  table: { marginBottom: 4 },
  tHead: { flexDirection: "row", borderBottom: `1.5px solid ${NAVY}`, paddingBottom: 5, marginBottom: 2 },
  tRow: { flexDirection: "row", borderBottom: `1px solid ${RULE}`, paddingVertical: 4 },
  tTotal: { flexDirection: "row", borderTop: `1.5px solid ${NAVY}`, paddingTop: 6, marginTop: 2 },
  cDesc: { flex: 2.4, fontSize: 9.5 },
  cNum: { flex: 1, fontSize: 9.5, textAlign: "right" },
  thDesc: { flex: 2.4, fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: NAVY },
  thNum: { flex: 1, fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: NAVY, textAlign: "right" },
  descCell: { color: NAVY_2, fontWeight: 700 },
  numCell: { color: ROW_TEXT },
  totalCell: { color: NAVY, fontWeight: 700 },

  costTotal: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 14, marginBottom: 20 },
  costTotalLabel: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: NAVY },
  costTotalValue: { fontSize: 18, fontWeight: 700, color: NAVY },

  bottomRow: { flexDirection: "row", gap: 20 },
  methodTitle: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: METHOD_PINK, marginBottom: 8 },
  step: { fontSize: 9.5, color: NAVY_2, marginBottom: 5 },
  emptyNote: { fontSize: 9, color: "#a9b6d1", fontStyle: "italic" },
});

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

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

  const rows = recipe.ingredients.map((i) => {
    const { costPerServing } = computePricing({
      costPricePerContainer: i.ingredientProduct.costPricePerContainer,
      servingsPerContainer: i.ingredientProduct.servingsPerContainer,
      salePricePerServing: null,
    });
    const isLiquid = i.uom === "ML";
    const oz = isLiquid ? i.quantity : 0;
    const ml = isLiquid ? i.quantity * 30 : 0;
    const gr = isLiquid ? 0 : i.quantity;
    const costoLiquidos = isLiquid ? costPerServing * i.quantity : 0;
    const costoSolidos = isLiquid ? 0 : costPerServing * i.quantity;
    // Cost per liter/kg equivalent — a straight unit conversion of the real
    // per-serving cost, valid regardless of the ingredient product's actual
    // container size (never a guess, just costPerServing rescaled).
    const costoLtKg = isLiquid ? costPerServing * (1000 / 30) : costPerServing * 1000;
    return { name: i.ingredientProduct.name, oz, ml, gr, costoLtKg, costoLiquidos, costoSolidos };
  });

  const totals = rows.reduce(
    (acc, r) => ({
      oz: acc.oz + r.oz,
      ml: acc.ml + r.ml,
      gr: acc.gr + r.gr,
      costoLiquidos: acc.costoLiquidos + r.costoLiquidos,
      costoSolidos: acc.costoSolidos + r.costoSolidos,
    }),
    { oz: 0, ml: 0, gr: 0, costoLiquidos: 0, costoSolidos: 0 },
  );
  const rawTotal = totals.costoLiquidos + totals.costoSolidos;
  const costoTotalBebida = recipe.yieldServings > 0 ? rawTotal / recipe.yieldServings : rawTotal;

  const doc = (
    <Document>
      <Page size="A5" style={styles.page}>
        <Text style={styles.eyebrow}>Receta de</Text>
        <Text style={styles.title}>
          {recipe.product.emoji ? `${recipe.product.emoji} ` : ""}
          {recipe.product.name}
        </Text>
        {recipe.description && <Text style={styles.subtitle}>{recipe.description}</Text>}

        {recipe.photoUrl && <Image style={styles.photo} src={recipe.photoUrl} />}

        <View style={styles.topRow}>
          <View style={styles.col}>
            <Text style={styles.label}>Vaso sugerido</Text>
            <Text style={styles.value}>{recipe.glassLabel || "—"}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Guarnición</Text>
            <Text style={styles.value}>{recipe.garnish || "—"}</Text>
          </View>
        </View>

        <Text style={styles.h2}>Ingredientes</Text>
        <View style={styles.table}>
          <View style={styles.tHead}>
            <Text style={styles.thDesc}>Descripción</Text>
            <Text style={styles.thNum}>Oz</Text>
            <Text style={styles.thNum}>Ml</Text>
            <Text style={styles.thNum}>Gr</Text>
            <Text style={styles.thNum}>Costo Lt/Kg</Text>
            <Text style={styles.thNum}>Costo líq.</Text>
            <Text style={styles.thNum}>Costo sól.</Text>
          </View>
          {rows.map((r, idx) => (
            <View key={idx} style={styles.tRow}>
              <Text style={[styles.cDesc, styles.descCell]}>{r.name}</Text>
              <Text style={[styles.cNum, styles.numCell]}>{r.oz > 0 ? r.oz.toFixed(2) : "—"}</Text>
              <Text style={[styles.cNum, styles.numCell]}>{r.ml > 0 ? r.ml.toFixed(0) : "—"}</Text>
              <Text style={[styles.cNum, styles.numCell]}>{r.gr > 0 ? r.gr.toFixed(2) : "—"}</Text>
              <Text style={[styles.cNum, styles.numCell]}>{money(r.costoLtKg)}</Text>
              <Text style={[styles.cNum, styles.numCell]}>{r.costoLiquidos > 0 ? money(r.costoLiquidos) : "—"}</Text>
              <Text style={[styles.cNum, styles.numCell]}>{r.costoSolidos > 0 ? money(r.costoSolidos) : "—"}</Text>
            </View>
          ))}
          <View style={styles.tTotal}>
            <Text style={[styles.cDesc, styles.totalCell]}>Total</Text>
            <Text style={[styles.cNum, styles.totalCell]}>{totals.oz.toFixed(2)}</Text>
            <Text style={[styles.cNum, styles.totalCell]}>{totals.ml.toFixed(0)}</Text>
            <Text style={[styles.cNum, styles.totalCell]}>{totals.gr.toFixed(2)}</Text>
            <Text style={styles.cNum}></Text>
            <Text style={[styles.cNum, styles.totalCell]}>{money(totals.costoLiquidos)}</Text>
            <Text style={[styles.cNum, styles.totalCell]}>{money(totals.costoSolidos)}</Text>
          </View>
        </View>

        <View style={styles.costTotal}>
          <Text style={styles.costTotalLabel}>Costo total de la bebida</Text>
          <Text style={styles.costTotalValue}>{money(costoTotalBebida)}</Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={{ flex: 1.2 }}>
            <Text style={styles.methodTitle}>Método de preparación</Text>
            {steps.length > 0 ? (
              steps.map((s, idx) => (
                <Text key={idx} style={styles.step}>
                  {idx + 1}. {s}
                </Text>
              ))
            ) : (
              <Text style={styles.emptyNote}>(sin preparación cargada todavía)</Text>
            )}
          </View>
        </View>
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
