import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, BackLink } from "@/components/ui";
import { ProductForm } from "../ProductForm";
import { updateProduct, deleteProduct } from "../actions";
import { DeleteButton } from "./DeleteButton";

export default async function EditProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  const categories = await prisma.category.findMany({
    where: { venueId: product.venueId },
    orderBy: { sortOrder: "asc" },
  });
  const suppliers = await prisma.supplier.findMany({ where: { venueId: product.venueId } });

  const boundUpdate = async (formData: FormData) => {
    "use server";
    await updateProduct(id, formData);
  };
  const boundDelete = async () => {
    "use server";
    await deleteProduct(id);
  };

  return (
    <div>
      <BackLink href="/productos" label="Volver a Productos" />
      <PageHeader title={product.name} />
      <Card>
        <ProductForm
          action={boundUpdate}
          categories={categories}
          suppliers={suppliers}
          initial={{
            name: product.name,
            categoryId: product.categoryId,
            containerLabel: product.containerLabel,
            servingsPerContainer: product.servingsPerContainer,
            costPricePerContainer: product.costPricePerContainer,
            salePricePerServing: product.salePricePerServing,
            carbonation: product.carbonation,
            emoji: product.emoji,
            colorHex: product.colorHex,
            showOnQuickGrid: product.showOnQuickGrid,
            primarySupplierId: product.primarySupplierId,
            reorderThreshold: product.reorderThreshold,
            countingServingsPerContainer: product.countingServingsPerContainer,
          }}
          submitLabel="Guardar cambios"
        />
      </Card>
      <div className="mt-4">
        <DeleteButton action={boundDelete} />
      </div>
    </div>
  );
}
