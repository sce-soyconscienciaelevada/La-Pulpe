import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { ProductForm } from "../ProductForm";
import { createProduct } from "../actions";

export default async function NuevoProductoPage() {
  const venue = await prisma.venue.findFirstOrThrow();
  const categories = await prisma.category.findMany({ where: { venueId: venue.id }, orderBy: { sortOrder: "asc" } });
  const suppliers = await prisma.supplier.findMany({ where: { venueId: venue.id } });

  return (
    <div>
      <PageHeader title="Nuevo producto" />
      <Card>
        <ProductForm
          action={createProduct}
          categories={categories}
          suppliers={suppliers}
          submitLabel="Crear producto"
        />
      </Card>
    </div>
  );
}
