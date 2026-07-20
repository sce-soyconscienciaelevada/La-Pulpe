import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { updateVenue } from "./actions";
import { PasswordForm } from "./PasswordForm";

export default async function AjustesPage() {
  const venue = await prisma.venue.findFirstOrThrow();
  const categories = await prisma.category.findMany({
    where: { venueId: venue.id },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Ajustes" />

      <Card>
        <h2 className="font-semibold text-text mb-3">Negocio</h2>
        <form action={updateVenue} className="grid sm:grid-cols-2 gap-3">
          <input
            name="name"
            defaultValue={venue.name}
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text"
          />
          <input
            name="currency"
            defaultValue={venue.currency}
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text"
          />
          <button
            type="submit"
            className="sm:col-span-2 rounded-lg bg-accent text-bg font-semibold py-2.5 text-sm"
          >
            Guardar
          </button>
        </form>
      </Card>

      <Card>
        <h2 className="font-semibold text-text mb-3">Categorías</h2>
        <ul className="text-sm text-text space-y-1">
          {categories.map((c) => (
            <li key={c.id}>{c.name}</li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="font-semibold text-text mb-3">Contraseña</h2>
        <PasswordForm />
      </Card>
    </div>
  );
}
