import { prisma } from "../src/lib/prisma";

async function main() {
  const productCount = await prisma.product.count();
  const quickGrid = await prisma.product.findMany({
    where: { showOnQuickGrid: true },
    orderBy: { quickGridSort: "asc" },
    select: { name: true, emoji: true, quickGridSort: true },
  });
  const recipes = await prisma.recipe.findMany({
    include: { product: true, ingredients: { include: { ingredientProduct: true } } },
  });
  const suppliers = await prisma.supplier.findMany({ include: { categories: true } });
  const cats = await prisma.category.count();
  const periods = await prisma.stockPeriod.findMany({
    include: { _count: { select: { counts: true } } },
  });
  const users = await prisma.user.findMany({ select: { email: true, role: true } });

  console.log("Products:", productCount, "| Categories:", cats);
  console.log("Quick grid:", quickGrid.map((q) => q.emoji + " " + q.name).join(", "));
  console.log("Recipes:");
  for (const r of recipes) {
    console.log(
      " -",
      r.product.name,
      "=",
      r.ingredients.map((i) => i.quantity + " " + i.ingredientProduct.name).join(" + ")
    );
  }
  console.log(
    "Suppliers:",
    suppliers.map((s) => s.name + " [" + s.categories.map((c) => c.name).join(",") + "]").join(" | ")
  );
  console.log("Stock periods:", periods.map((p) => p.label + ": " + p._count.counts + " counts").join(", "));
  console.log("Users:", JSON.stringify(users));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
