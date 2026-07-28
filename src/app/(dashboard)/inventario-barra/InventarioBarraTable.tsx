"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, Table, Badge } from "@/components/ui";
import { updateBarInventoryEntry } from "./actions";

type Row = {
  id: string;
  productId: string;
  productName: string;
  categoryName: string;
  countingServingsPerContainer: number | null;
  initialQuantity: number;
  entradas: number;
  ventaPunto: number;
  countedPhysical: number | null;
  registroReference: number | null;
};
type Group = { name: string; items: Row[] };

function finalTeorico(row: { initialQuantity: number; entradas: number; ventaPunto: number }) {
  return row.initialQuantity + row.entradas - row.ventaPunto;
}

// Splits a blended quantity (whole sealed piezas + the currently-open
// bottle's remaining fraction) for display — matches the source SOP's own
// convention: "Botella cerrada = 1 pieza = 1.0". A value like 2.7 means
// 2 sealed piezas plus one open bottle marked at 0.7 (7 of its 10 counted
// puntos remain). Kept local to this Client Component (not imported from
// lib/bar-inventory.ts) to avoid pulling Prisma into the browser bundle —
// same reason HeladerasTable/VentasPosClient split their helpers out.
function formatClosedOpen(totalQuantity: number): string {
  const closedPiezas = Math.floor(totalQuantity + 1e-9);
  const openFraction = Math.max(0, totalQuantity - closedPiezas);
  if (openFraction < 0.05) return `${closedPiezas} cerrada${closedPiezas === 1 ? "" : "s"}`;
  const puntos = Math.round(openFraction * 10);
  return `${closedPiezas} cerrada${closedPiezas === 1 ? "" : "s"} + abierta (${puntos}/10)`;
}

export function InventarioBarraTable({ groups }: { groups: Group[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  function fieldKey(rowId: string, field: string) {
    return `${rowId}:${field}`;
  }

  function valueFor(row: Row, field: "entradas" | "ventaPunto" | "countedPhysical") {
    const draft = drafts[fieldKey(row.id, field)];
    if (draft !== undefined) return draft;
    const v = row[field];
    return v === null || v === undefined ? "" : String(v);
  }

  function save(row: Row, field: "entradas" | "ventaPunto" | "countedPhysical", raw: string) {
    const v = raw === "" ? null : Number(raw);
    if (v !== null && Number.isNaN(v)) return;
    startTransition(async () => {
      if (field === "countedPhysical") {
        await updateBarInventoryEntry(row.id, { countedPhysical: v });
      } else {
        await updateBarInventoryEntry(row.id, { [field]: v ?? 0 } as { entradas: number } | { ventaPunto: number });
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Card key={group.name}>
          <h3 className="font-semibold text-text mb-3">{group.name}</h3>
          <Table>
            <thead>
              <tr className="text-left text-xs text-text-muted border-b border-border">
                <th className="px-3 py-2">Producto</th>
                <th className="px-2 py-2">Exist. inicial</th>
                <th className="px-2 py-2">Entradas</th>
                <th className="px-2 py-2">Venta x Punto</th>
                <th className="px-2 py-2">Final Teórico</th>
                <th className="px-2 py-2">Referencia Registro</th>
                <th className="px-2 py-2">Contado físico</th>
                <th className="px-2 py-2">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {group.items.map((row) => {
                const teorico = finalTeorico(row);
                const countedDraft = valueFor(row, "countedPhysical");
                const counted = countedDraft === "" ? null : Number(countedDraft);
                const variance = counted === null || Number.isNaN(counted) ? null : counted - teorico;
                return (
                  <tr key={row.id} className="border-b border-border">
                    <td className="px-3 py-2 text-text whitespace-nowrap">{row.productName}</td>
                    <td className="px-2 py-2 text-text-muted text-center whitespace-nowrap">
                      {formatClosedOpen(row.initialQuantity)}
                    </td>
                    <td className="px-1 py-1">
                      <input
                        type="number"
                        step="0.1"
                        value={valueFor(row, "entradas")}
                        onChange={(e) => setDrafts({ ...drafts, [fieldKey(row.id, "entradas")]: e.target.value })}
                        onBlur={(e) => save(row, "entradas", e.target.value)}
                        className="w-16 rounded-lg border border-border bg-bg-elevated px-2 py-1 text-sm text-text text-center outline-none focus:border-accent"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <input
                        type="number"
                        step="0.1"
                        value={valueFor(row, "ventaPunto")}
                        onChange={(e) => setDrafts({ ...drafts, [fieldKey(row.id, "ventaPunto")]: e.target.value })}
                        onBlur={(e) => save(row, "ventaPunto", e.target.value)}
                        className="w-16 rounded-lg border border-border bg-bg-elevated px-2 py-1 text-sm text-text text-center outline-none focus:border-accent"
                      />
                    </td>
                    <td className="px-2 py-2 text-center font-medium text-text whitespace-nowrap">
                      {formatClosedOpen(teorico)}
                    </td>
                    <td className="px-2 py-2 text-center text-text-muted">
                      {row.registroReference !== null ? row.registroReference.toFixed(1) : "—"}
                    </td>
                    <td className="px-1 py-1">
                      <input
                        type="number"
                        step="0.1"
                        value={valueFor(row, "countedPhysical")}
                        onChange={(e) => setDrafts({ ...drafts, [fieldKey(row.id, "countedPhysical")]: e.target.value })}
                        onBlur={(e) => save(row, "countedPhysical", e.target.value)}
                        className="w-16 rounded-lg border border-border bg-bg-elevated px-2 py-1 text-sm text-text text-center outline-none focus:border-accent"
                      />
                      {counted !== null && !Number.isNaN(counted) && (
                        <div className="text-[10px] text-text-muted text-center mt-0.5 whitespace-nowrap">
                          {formatClosedOpen(counted)}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {variance === null ? (
                        <span className="text-text-muted">—</span>
                      ) : Math.abs(variance) < 0.05 ? (
                        <Badge tone="profit">✓ correcto</Badge>
                      ) : variance < 0 ? (
                        <Badge tone="loss">⚠ merma {variance.toFixed(1)}</Badge>
                      ) : (
                        <Badge tone="loss">⚠ error +{variance.toFixed(1)}</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      ))}
      <a
        href="/api/reportes/inventario-barra"
        target="_blank"
        rel="noreferrer"
        className="inline-block rounded-lg bg-accent text-bg font-semibold px-4 py-2 text-sm"
      >
        🖨️ Imprimir reporte semanal
      </a>
    </div>
  );
}
