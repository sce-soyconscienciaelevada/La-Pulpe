import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";

export default async function RecetarioPage() {
  const venue = await prisma.venue.findFirstOrThrow();
  const recipes = await prisma.recipe.findMany({
    where: { product: { venueId: venue.id } },
    include: { product: true },
    orderBy: { product: { name: "asc" } },
  });

  return (
    <div>
      <PageHeader
        title="Recetario"
        subtitle="Ficha técnica de cada trago — foto, descripción, preparación y guarnición"
      />

      {recipes.length === 0 ? (
        <Card>
          <p className="text-sm text-text-muted">
            Todavía no hay recetas creadas.{" "}
            <Link href="/costeo" className="text-accent underline">
              Creá una en Costeo & Recetas
            </Link>{" "}
            primero (elegís el producto y los ingredientes) — después volvé acá para
            completar la ficha técnica.
          </p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((r) => (
            <Link key={r.id} href={`/recetario/${r.productId}`}>
              <Card className="h-full hover:border-accent transition">
                <div className="aspect-video rounded-lg bg-bg-elevated mb-3 flex items-center justify-center overflow-hidden">
                  {r.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.photoUrl} alt={r.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">{r.product.emoji ?? "🍸"}</span>
                  )}
                </div>
                <h3 className="font-medium text-text">{r.product.name}</h3>
                <p className="text-sm text-text-muted mt-1 line-clamp-2">
                  {r.description || "Sin descripción todavía"}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4">
        <Link href="/costeo" className="text-sm text-accent underline">
          + Nueva receta (Costeo & Recetas)
        </Link>
      </div>
    </div>
  );
}
