import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { ProveedoresClient } from "./ProveedoresClient";

export default async function ProveedoresPage() {
  const venue = await prisma.venue.findFirstOrThrow();
  const suppliers = await prisma.supplier.findMany({
    where: { venueId: venue.id },
    include: { categories: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title="Proveedores" />
      <ProveedoresClient
        suppliers={suppliers.map((s) => ({
          id: s.id,
          name: s.name,
          contactPhone: s.contactPhone,
          contactNote: s.contactNote,
          categoryNames: s.categories.map((c) => c.name),
        }))}
      />
    </div>
  );
}
