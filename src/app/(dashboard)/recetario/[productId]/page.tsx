import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { FichaTecnicaForm } from "./FichaTecnicaForm";

export default async function FichaTecnicaPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { productId },
    include: {
      product: true,
      ingredients: { include: { ingredientProduct: true } },
    },
  });
  if (!recipe) notFound();

  return (
    <div>
      <PageHeader title={`${recipe.product.emoji ?? ""} ${recipe.product.name}`} subtitle="Ficha técnica" />

      <div className="grid lg:grid-cols-2 gap-4">
        <FichaTecnicaForm
          productId={productId}
          initial={{
            photoUrl: recipe.photoUrl ?? "",
            description: recipe.description ?? "",
            preparationSteps: recipe.preparationSteps ?? "",
            garnish: recipe.garnish ?? "",
            glassLabel: recipe.glassLabel ?? "",
          }}
        />

        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-text mb-3">Ingredientes</h3>
            <ul className="text-sm text-text space-y-1">
              {recipe.ingredients.map((i) => (
                <li key={i.id}>
                  {i.quantity} medida(s) de {i.ingredientProduct.emoji} {i.ingredientProduct.name}
                </li>
              ))}
            </ul>
            <p className="text-xs text-text-muted mt-3">
              Para cambiar ingredientes o el costo, andá a{" "}
              <a href="/costeo" className="text-accent underline">
                Costeo & Recetas
              </a>
              .
            </p>
          </Card>

          <a
            href={`/api/reportes/ficha-tecnica?productId=${productId}`}
            target="_blank"
            rel="noreferrer"
            className="block text-center rounded-lg bg-accent text-bg font-semibold py-3"
          >
            🖨️ Imprimir ficha técnica
          </a>
        </div>
      </div>
    </div>
  );
}
