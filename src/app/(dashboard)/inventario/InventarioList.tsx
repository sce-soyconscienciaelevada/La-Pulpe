"use client";

import { useState, useTransition, useMemo } from "react";
import { quickAddStock, quickRemoveStock } from "./actions";
import { Card, Badge } from "@/components/ui";

type ProductRow = {
  id: string;
  name: string;
  emoji: string | null;
  containerLabel: string | null;
  currentStock: number;
  reorderThreshold: number | null;
  categoryName: string;
};

export function InventarioList({ products }: { products: ProductRow[] }) {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

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

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar producto..."
        className="w-full mb-4 rounded-lg border border-border bg-bg-card px-3 py-2.5 text-base text-text outline-none focus:border-accent"
      />

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
