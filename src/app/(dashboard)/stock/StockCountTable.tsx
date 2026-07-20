"use client";

import { useState, useTransition } from "react";
import { saveCount, closePeriodAction } from "./actions";
import { Table, Badge } from "@/components/ui";

type Row = {
  productId: string;
  productName: string;
  emoji: string | null;
  initialQuantity: number;
  countedFinalQuantity: number | null;
  variance: number | null;
};

export function StockCountTable({
  periodId,
  periodLabel,
  status,
  rows,
}: {
  periodId: string;
  periodLabel: string;
  status: "OPEN" | "CLOSED";
  rows: Row[];
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <Table>
        <thead>
          <tr className="text-left text-xs text-text-muted border-b border-border">
            <th className="px-3 py-2">Producto</th>
            <th className="px-3 py-2">Inicial</th>
            <th className="px-3 py-2">Contado</th>
            <th className="px-3 py-2">Diferencia</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.productId} className="border-b border-border">
              <td className="px-3 py-2 text-text whitespace-nowrap">
                {r.emoji} {r.productName}
              </td>
              <td className="px-3 py-2 text-text-muted">{r.initialQuantity.toFixed(1)}</td>
              <td className="px-3 py-2">
                {status === "OPEN" ? (
                  <input
                    type="number"
                    step="0.1"
                    value={drafts[r.productId] ?? (r.countedFinalQuantity ?? "")}
                    onChange={(e) => setDrafts({ ...drafts, [r.productId]: e.target.value })}
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (!Number.isNaN(v) && e.target.value !== "") {
                        startTransition(() => saveCount(periodId, r.productId, v));
                      }
                    }}
                    className="w-20 rounded-lg border border-border bg-bg-elevated px-2 py-1 text-sm text-text outline-none focus:border-accent"
                  />
                ) : (
                  <span className="text-text">{r.countedFinalQuantity?.toFixed(1) ?? "—"}</span>
                )}
              </td>
              <td className="px-3 py-2">
                {r.variance !== null ? (
                  <Badge tone={r.variance < 0 ? "loss" : r.variance > 0 ? "profit" : "default"}>
                    {r.variance > 0 ? "+" : ""}
                    {r.variance.toFixed(1)}
                  </Badge>
                ) : (
                  <span className="text-text-muted">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {status === "OPEN" && (
        <button
          disabled={isPending}
          onClick={() => {
            const label = prompt("Nombre del próximo período:", "Nuevo período");
            if (!label) return;
            if (
              confirm(
                "¿Cerrar este período? Se congela lo esperado vs. contado, se ajusta el stock por la diferencia, y arranca un período nuevo."
              )
            ) {
              startTransition(() => closePeriodAction(periodId, label));
            }
          }}
          className="mt-4 rounded-lg bg-accent text-bg font-semibold px-5 py-2.5 text-sm"
        >
          Cerrar {periodLabel} y arrancar el próximo
        </button>
      )}
    </div>
  );
}
