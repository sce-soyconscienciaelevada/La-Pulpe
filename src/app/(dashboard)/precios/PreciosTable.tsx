"use client";

import { useState, useTransition, useMemo } from "react";
import { updateSalePrice, updateCostPrice } from "./actions";
import { Table, Badge, formatARS } from "@/components/ui";

type Row = {
  id: string;
  name: string;
  emoji: string | null;
  costPricePerContainer: number;
  costPerServing: number;
  salePricePerServing: number | null;
  profitPerServing: number | null;
  marginPercent: number | null;
};

export function PreciosTable({ rows }: { rows: Row[] }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [costDrafts, setCostDrafts] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const am = a.marginPercent ?? -Infinity;
        const bm = b.marginPercent ?? -Infinity;
        return am - bm; // worst margin first
      }),
    [rows]
  );

  return (
    <Table>
      <thead>
        <tr className="text-left text-xs text-text-muted border-b border-border">
          <th className="px-3 py-2">Producto</th>
          <th className="px-3 py-2">Costo/envase</th>
          <th className="px-3 py-2">Costo/medida</th>
          <th className="px-3 py-2">Venta/medida</th>
          <th className="px-3 py-2">Ganancia/medida</th>
          <th className="px-3 py-2">Margen</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((r) => (
          <tr key={r.id} className="border-b border-border">
            <td className="px-3 py-2 text-text whitespace-nowrap">
              {r.emoji} {r.name}
            </td>
            <td className="px-3 py-2">
              <input
                type="number"
                step="0.01"
                value={costDrafts[r.id] ?? (r.costPricePerContainer || "")}
                onChange={(e) => setCostDrafts({ ...costDrafts, [r.id]: e.target.value })}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isNaN(v) && e.target.value !== "") {
                    startTransition(() => updateCostPrice(r.id, v));
                  }
                }}
                placeholder="sin costo"
                className="w-24 rounded-lg border border-border bg-bg-elevated px-2 py-1 text-sm text-text outline-none focus:border-accent"
                disabled={isPending}
              />
            </td>
            <td className="px-3 py-2 text-text-muted">{formatARS(r.costPerServing)}</td>
            <td className="px-3 py-2">
              <input
                type="number"
                step="0.01"
                value={drafts[r.id] ?? (r.salePricePerServing ?? "")}
                onChange={(e) => setDrafts({ ...drafts, [r.id]: e.target.value })}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isNaN(v) && e.target.value !== "") {
                    startTransition(() => updateSalePrice(r.id, v));
                  }
                }}
                placeholder="sin precio"
                className="w-24 rounded-lg border border-border bg-bg-elevated px-2 py-1 text-sm text-text outline-none focus:border-accent"
                disabled={isPending}
              />
            </td>
            <td className="px-3 py-2 text-text-muted">
              {r.profitPerServing !== null ? formatARS(r.profitPerServing) : "—"}
            </td>
            <td className="px-3 py-2">
              {r.marginPercent !== null ? (
                <Badge tone={r.marginPercent < 30 ? "loss" : r.marginPercent < 60 ? "default" : "profit"}>
                  {r.marginPercent.toFixed(0)}%
                </Badge>
              ) : (
                <Badge tone="loss">sin precio</Badge>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
