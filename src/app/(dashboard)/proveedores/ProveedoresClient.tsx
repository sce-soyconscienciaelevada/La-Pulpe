"use client";

import { useTransition } from "react";
import { createSupplier, deleteSupplier } from "./actions";
import { Card } from "@/components/ui";

type Supplier = {
  id: string;
  name: string;
  contactPhone: string | null;
  contactNote: string | null;
  categoryNames: string[];
};

export function ProveedoresClient({ suppliers }: { suppliers: Supplier[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="font-semibold text-text mb-3">Nuevo proveedor</h2>
        <form action={createSupplier} className="grid sm:grid-cols-3 gap-3">
          <input
            name="name"
            required
            placeholder="Nombre"
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text"
          />
          <input
            name="contactPhone"
            placeholder="Teléfono (opcional)"
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text"
          />
          <input
            name="contactNote"
            placeholder="Nota (opcional)"
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text"
          />
          <button
            type="submit"
            className="sm:col-span-3 rounded-lg bg-accent text-bg font-semibold py-2.5 text-sm"
          >
            Agregar proveedor
          </button>
        </form>
      </Card>

      <div className="grid sm:grid-cols-2 gap-3">
        {suppliers.map((s) => (
          <Card key={s.id}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium text-text">{s.name}</div>
                {s.contactPhone && <div className="text-sm text-text-muted">{s.contactPhone}</div>}
                {s.contactNote && <div className="text-xs text-text-muted">{s.contactNote}</div>}
                {s.categoryNames.length > 0 && (
                  <div className="text-xs text-text-muted mt-1">{s.categoryNames.join(", ")}</div>
                )}
              </div>
              <button
                disabled={isPending}
                onClick={() => {
                  if (confirm(`¿Eliminar proveedor "${s.name}"?`)) {
                    startTransition(() => deleteSupplier(s.id));
                  }
                }}
                className="text-loss text-xs underline shrink-0"
              >
                eliminar
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
