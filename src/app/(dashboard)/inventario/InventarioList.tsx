"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { quickAddStock, quickRemoveStock, createProductQuick, deleteProductFromInventario } from "./actions";
import { Card, Badge } from "@/components/ui";

type ProductRow = {
  id: string;
  name: string;
  emoji: string | null;
  containerLabel: string | null;
  currentStock: number;
  reorderThreshold: number | null;
  categoryName: string;
  categoryId: string;
};

type Category = { id: string; name: string };

export function InventarioList({
  products,
  categories,
}: {
  products: ProductRow[];
  categories: Category[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const filtered = products.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase())
    );
    const map = new Map<string, ProductRow[]>();
    for (const p of filtered) {
      if (!map.has(p.categoryName)) map.set(p.categoryName, []);
      map.get(p.categoryName)!.push(p);
    }
    return map;
  }, [products, query]);

  function handleDelete(p: ProductRow) {
    setError(null);
    if (!confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) return;
    startTransition(async () => {
      const res = await deleteProductFromInventario(p.id);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar producto..."
          className="flex-1 rounded-lg border border-border bg-bg-card px-3 py-2.5 text-base text-text outline-none focus:border-accent"
        />
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-lg bg-accent text-bg font-semibold px-4 py-2.5 text-sm whitespace-nowrap"
        >
          {showAddForm ? "Cancelar" : "+ Agregar producto"}
        </button>
      </div>

      {error && (
        <Card className="mb-4 border-loss">
          <p className="text-sm text-loss">{error}</p>
        </Card>
      )}

      {showAddForm && (
        <AddProductForm
          categories={categories}
          isPending={isPending}
          startTransition={startTransition}
          onDone={() => {
            setShowAddForm(false);
            router.refresh();
          }}
        />
      )}

      <div className="space-y-4">
        {Array.from(grouped.entries()).map(([category, items]) => (
          <Card key={category}>
            <h3 className="font-semibold text-text mb-3">{category}</h3>
            <div>
              {items.map((p) => {
                const low = p.reorderThreshold !== null && p.currentStock <= p.reorderThreshold;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 py-2.5 border-b border-border"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-text truncate">
                        {p.emoji} {p.name}
                      </div>
                      <div className="text-xs text-text-muted">{p.containerLabel ?? "—"}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {low && <Badge tone="loss">bajo</Badge>}
                      <span className="text-sm font-semibold text-text w-16 text-right">
                        {p.currentStock.toFixed(1)}
                      </span>
                      <button
                        disabled={isPending}
                        onClick={() => startTransition(() => quickAddStock(p.id, 1))}
                        className="w-7 h-7 rounded-full bg-profit/15 text-profit text-sm font-bold"
                        aria-label={`Agregar 1 a ${p.name}`}
                      >
                        +
                      </button>
                      <button
                        disabled={isPending}
                        onClick={() => startTransition(() => quickRemoveStock(p.id, 1, "BREAKAGE"))}
                        className="w-7 h-7 rounded-full bg-loss/15 text-loss text-sm font-bold"
                        aria-label={`Quitar 1 a ${p.name} (rotura)`}
                      >
                        −
                      </button>
                      <button
                        disabled={isPending}
                        onClick={() => handleDelete(p)}
                        className="w-7 h-7 rounded-full bg-border text-text-muted text-sm"
                        aria-label={`Eliminar ${p.name}`}
                        title="Eliminar producto"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
        {grouped.size === 0 && (
          <p className="text-sm text-text-muted">No se encontraron productos.</p>
        )}
      </div>
    </div>
  );
}

function AddProductForm({
  categories,
  isPending,
  startTransition,
  onDone,
}: {
  categories: Category[];
  isPending: boolean;
  startTransition: (fn: () => void | Promise<void>) => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [containerLabel, setContainerLabel] = useState("");
  const [servingsPerContainer, setServingsPerContainer] = useState(1);
  const [costPricePerContainer, setCostPricePerContainer] = useState(0);

  return (
    <Card className="mb-4">
      <h3 className="font-semibold text-text mb-3">Nuevo producto</h3>
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre"
          className="rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text sm:col-span-2"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          value={containerLabel}
          onChange={(e) => setContainerLabel(e.target.value)}
          placeholder="Envase (ej: 750ml)"
          className="rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text"
        />
        <input
          type="number"
          step="0.01"
          value={servingsPerContainer}
          onChange={(e) => setServingsPerContainer(Number(e.target.value) || 1)}
          placeholder="Medidas por envase"
          className="rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text"
        />
        <input
          type="number"
          step="0.01"
          value={costPricePerContainer}
          onChange={(e) => setCostPricePerContainer(Number(e.target.value) || 0)}
          placeholder="Costo por envase ($)"
          className="rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text"
        />
      </div>
      <button
        disabled={isPending || !name.trim() || !categoryId}
        onClick={() =>
          startTransition(async () => {
            await createProductQuick({
              name,
              categoryId,
              containerLabel,
              servingsPerContainer,
              costPricePerContainer,
            });
            onDone();
          })
        }
        className="w-full rounded-lg bg-accent text-bg font-semibold py-2.5 text-sm disabled:opacity-50"
      >
        Crear producto
      </button>
      <p className="text-xs text-text-muted mt-2">
        Para más detalle (emoji, precio de venta, proveedor) editalo después en Productos.
      </p>
    </Card>
  );
}
