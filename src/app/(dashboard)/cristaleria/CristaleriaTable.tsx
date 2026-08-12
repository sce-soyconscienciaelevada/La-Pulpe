"use client";

import { useState, useTransition, Fragment } from "react";
import { useRouter } from "next/navigation";
import {
  recordGlasswareCount,
  addWeekAction,
  closeMonthAction,
  createGlasswareItem,
  deleteGlasswareItem,
} from "./actions";
import { Card, Table, Badge } from "@/components/ui";

type Week = { id: string; weekNumber: number; label: string };
type ItemRow = {
  id: string;
  code: string;
  name: string;
  stockBase: number;
  counts: Record<string, number | null>; // weekId -> quantity
};

export function CristaleriaTable({
  venueId,
  monthPeriodId,
  monthLabel,
  weeks,
  barraItems,
  depositoItems,
}: {
  venueId: string;
  monthPeriodId: string;
  monthLabel: string;
  weeks: Week[];
  barraItems: ItemRow[];
  depositoItems: ItemRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">{monthLabel}</Badge>
        <button
          disabled={isPending}
          onClick={() => startTransition(async () => { await addWeekAction(monthPeriodId); router.refresh(); })}
          className="rounded-lg border border-border text-text px-3 py-1.5 text-sm"
        >
          + Agregar semana
        </button>
        <button
          disabled={isPending}
          onClick={() => {
            if (confirm(`¿Cerrar ${monthLabel}? Arranca un mes nuevo.`)) {
              startTransition(async () => { await closeMonthAction(monthPeriodId, venueId); router.refresh(); });
            }
          }}
          className="rounded-lg border border-border text-text px-3 py-1.5 text-sm"
        >
          Cerrar mes
        </button>
        <a
          href="/api/reportes/cristaleria"
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-accent text-bg font-semibold px-3 py-1.5 text-sm"
        >
          🖨️ Imprimir reporte
        </a>
      </div>

      {error && (
        <Card className="border-loss">
          <p className="text-sm text-loss">{error}</p>
        </Card>
      )}

      <GlasswareSection
        title="1. Barra: Cristalería y Vajilla"
        location="BARRA"
        venueId={venueId}
        items={barraItems}
        weeks={weeks}
        isPending={isPending}
        startTransition={startTransition}
        onError={setError}
        router={router}
      />
      <GlasswareSection
        title="2. Depósito: Cristalería y Vajilla"
        location="DEPOSITO"
        venueId={venueId}
        items={depositoItems}
        weeks={weeks}
        isPending={isPending}
        startTransition={startTransition}
        onError={setError}
        router={router}
      />
    </div>
  );
}

function GlasswareSection({
  title,
  location,
  venueId,
  items,
  weeks,
  isPending,
  startTransition,
  onError,
  router,
}: {
  title: string;
  location: "BARRA" | "DEPOSITO";
  venueId: string;
  items: ItemRow[];
  weeks: Week[];
  isPending: boolean;
  startTransition: (fn: () => void | Promise<void>) => void;
  onError: (e: string | null) => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  function cellKey(itemId: string, weekId: string) {
    return `${itemId}:${weekId}`;
  }

  function valueFor(item: ItemRow, weekId: string) {
    const draft = drafts[cellKey(item.id, weekId)];
    if (draft !== undefined) return draft;
    const v = item.counts[weekId];
    return v === null || v === undefined ? "" : String(v);
  }

  function diffFor(item: ItemRow, weekIndex: number) {
    const current = item.counts[weeks[weekIndex].id];
    if (current === null || current === undefined) return null;
    const previous =
      weekIndex === 0 ? item.stockBase : item.counts[weeks[weekIndex - 1].id];
    if (previous === null || previous === undefined) return null;
    return previous - current;
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-text">{title}</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="text-sm text-accent underline">
          {showAdd ? "cancelar" : "+ item"}
        </button>
      </div>

      {showAdd && (
        <AddItemForm
          venueId={venueId}
          location={location}
          onDone={() => setShowAdd(false)}
          router={router}
        />
      )}

      <Table>
        <thead>
          <tr className="text-left text-xs text-text-muted border-b border-border">
            <th className="px-3 py-2">Código</th>
            <th className="px-3 py-2">Producto</th>
            <th className="px-3 py-2">Stock Base</th>
            {weeks.map((w) => (
              <th key={w.id} className="px-3 py-2" colSpan={2}>
                {w.label}
              </th>
            ))}
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-border">
              <td className="px-3 py-2 text-text-muted whitespace-nowrap">{item.code}</td>
              <td className="px-3 py-2 text-text whitespace-nowrap">{item.name}</td>
              <td className="px-3 py-2 text-text-muted">{item.stockBase}</td>
              {weeks.map((w, idx) => {
                const diff = diffFor(item, idx);
                return (
                  <Fragment key={w.id}>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        step="0.1"
                        value={valueFor(item, w.id)}
                        onChange={(e) =>
                          setDrafts({ ...drafts, [cellKey(item.id, w.id)]: e.target.value })
                        }
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (e.target.value !== "" && !Number.isNaN(v)) {
                            startTransition(async () => {
                              await recordGlasswareCount(w.id, item.id, v);
                              router.refresh();
                            });
                          }
                        }}
                        className="w-16 rounded-lg border border-border bg-bg-elevated px-2 py-1 text-sm text-text outline-none focus:border-accent"
                      />
                    </td>
                    <td className="px-2 py-2">
                      {diff !== null ? (
                        <Badge tone={diff > 0 ? "loss" : diff < 0 ? "profit" : "default"}>{diff}</Badge>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                  </Fragment>
                );
              })}
              <td className="px-2 py-2">
                <button
                  disabled={isPending}
                  onClick={() => {
                    onError(null);
                    if (!confirm(`¿Eliminar "${item.name}"?`)) return;
                    startTransition(async () => {
                      const res = await deleteGlasswareItem(item.id);
                      if (res?.error) onError(res.error);
                      else router.refresh();
                    });
                  }}
                  className="text-text-muted text-sm"
                  aria-label={`Eliminar ${item.name}`}
                >
                  🗑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

function AddItemForm({
  venueId,
  location,
  onDone,
  router,
}: {
  venueId: string;
  location: "BARRA" | "DEPOSITO";
  onDone: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [stockBase, setStockBase] = useState(0);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="grid sm:grid-cols-4 gap-2 mb-3 p-3 rounded-lg border border-border">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Código (ej: BAR-017)"
        className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text"
      />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Producto"
        className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text sm:col-span-2"
      />
      <input
        type="number"
        step="0.1"
        value={stockBase}
        onChange={(e) => setStockBase(Number(e.target.value) || 0)}
        placeholder="Stock base"
        className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text"
      />
      <button
        disabled={isPending || !code.trim() || !name.trim()}
        onClick={() =>
          startTransition(async () => {
            await createGlasswareItem({ venueId, code, name, location, stockBase });
            router.refresh();
            onDone();
          })
        }
        className="sm:col-span-4 rounded-lg bg-accent text-bg font-semibold py-2 text-sm disabled:opacity-50"
      >
        Crear item
      </button>
    </div>
  );
}
