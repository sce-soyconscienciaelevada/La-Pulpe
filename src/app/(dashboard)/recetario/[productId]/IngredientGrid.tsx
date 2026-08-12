"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveRecipeIngredients, type IngredientRowInput } from "../actions";
import { Card } from "@/components/ui";

type KnownIngredient = {
  norm: string;
  name: string;
  costPerServing: number; // real live cost per medida (ML) or per gram (GRAMOS)
};

type InitialRow = {
  recipeIngredientId: string;
  name: string;
  oz: number | null;
  gr: number | null;
  costPerServing: number;
};

type Row = {
  key: string;
  recipeIngredientId: string | null;
  name: string;
  oz: string;
  gr: string;
  newCostPerUnit: string; // only used for rows whose name matches no known ingredient
};

function normalize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function newKey() {
  return Math.random().toString(36).slice(2);
}

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

export function IngredientGrid({
  recipeId,
  initialRows,
  knownIngredients,
}: {
  recipeId: string;
  initialRows: InitialRow[];
  knownIngredients: KnownIngredient[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const knownByNorm = new Map(knownIngredients.map((k) => [k.norm, k]));

  const [rows, setRows] = useState<Row[]>(() =>
    initialRows.length > 0
      ? initialRows.map((r) => ({
          key: newKey(),
          recipeIngredientId: r.recipeIngredientId,
          name: r.name,
          oz: r.oz !== null ? String(r.oz) : "",
          gr: r.gr !== null ? String(r.gr) : "",
          newCostPerUnit: "",
        }))
      : [{ key: newKey(), recipeIngredientId: null, name: "", oz: "", gr: "", newCostPerUnit: "" }],
  );

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { key: newKey(), recipeIngredientId: null, name: "", oz: "", gr: "", newCostPerUnit: "" },
    ]);
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  function rowMath(row: Row) {
    const oz = parseFloat(row.oz);
    const gr = parseFloat(row.gr);
    const useOz = !isNaN(oz) && oz > 0;
    const useGr = !useOz && !isNaN(gr) && gr > 0;
    const ml = useOz ? oz * 30 : null;

    const known = knownByNorm.get(normalize(row.name));
    const newCost = parseFloat(row.newCostPerUnit);

    let costoLiquidos = 0;
    let costoSolidos = 0;
    if (useOz) {
      const costPerServing = known ? known.costPerServing : !isNaN(newCost) ? (newCost / 1000) * 30 : 0;
      costoLiquidos = costPerServing * oz;
    } else if (useGr) {
      const costPerServing = known ? known.costPerServing : !isNaN(newCost) ? newCost / 1000 : 0;
      costoSolidos = costPerServing * gr;
    }

    return { useOz, useGr, ml, costoLiquidos, costoSolidos, known };
  }

  const totals = rows.reduce(
    (acc, row) => {
      const m = rowMath(row);
      acc.oz += !isNaN(parseFloat(row.oz)) ? parseFloat(row.oz) : 0;
      acc.ml += m.ml ?? 0;
      acc.gr += !isNaN(parseFloat(row.gr)) ? parseFloat(row.gr) : 0;
      acc.costoLiquidos += m.costoLiquidos;
      acc.costoSolidos += m.costoSolidos;
      return acc;
    },
    { oz: 0, ml: 0, gr: 0, costoLiquidos: 0, costoSolidos: 0 },
  );
  const grandTotal = totals.costoLiquidos + totals.costoSolidos;

  function handleSave() {
    const payload: IngredientRowInput[] = rows
      .filter((r) => r.name.trim())
      .map((r) => {
        const oz = parseFloat(r.oz);
        const gr = parseFloat(r.gr);
        const newCost = parseFloat(r.newCostPerUnit);
        return {
          recipeIngredientId: r.recipeIngredientId,
          name: r.name.trim(),
          oz: !isNaN(oz) && oz > 0 ? oz : null,
          gr: !isNaN(gr) && gr > 0 ? gr : null,
          newIngredientCostPerUnit: !isNaN(newCost) ? newCost : null,
        };
      });

    startTransition(async () => {
      await saveRecipeIngredients(recipeId, payload);
      router.refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-text">Ingredientes</h3>
        <span className="text-[10px] font-bold tracking-wide uppercase text-accent bg-accent-soft px-2 py-0.5 rounded-full">
          editable
        </span>
      </div>
      <p className="text-xs text-text-muted mb-4">Cargá cada fila como en el Excel — Oz o Gr, nunca los dos.</p>

      <div className="overflow-x-auto">
        <div className="grid gap-x-2 gap-y-1.5 min-w-[640px]" style={{ gridTemplateColumns: "1.9fr 0.7fr 0.6fr 0.7fr 0.95fr 0.85fr 0.85fr 28px" }}>
          <span className="text-[9.5px] font-bold tracking-wide uppercase text-text-faint pb-1.5 border-b border-border">Descripción</span>
          <span className="text-[9.5px] font-bold tracking-wide uppercase text-text-faint pb-1.5 border-b border-border text-right">Oz</span>
          <span className="text-[9.5px] font-bold tracking-wide uppercase text-text-faint pb-1.5 border-b border-border text-right">Ml</span>
          <span className="text-[9.5px] font-bold tracking-wide uppercase text-text-faint pb-1.5 border-b border-border text-right">Gr</span>
          <span className="text-[9.5px] font-bold tracking-wide uppercase text-text-faint pb-1.5 border-b border-border text-right">Costo Lt/Kg</span>
          <span className="text-[9.5px] font-bold tracking-wide uppercase text-text-faint pb-1.5 border-b border-border text-right">Costo líq.</span>
          <span className="text-[9.5px] font-bold tracking-wide uppercase text-text-faint pb-1.5 border-b border-border text-right">Costo sól.</span>
          <span></span>

          {rows.map((row) => {
            const m = rowMath(row);
            const isKnown = !!m.known;
            return (
              <Fragment key={row.key}>
                <div className="relative flex items-center">
                  <input
                    value={row.name}
                    onChange={(e) => updateRow(row.key, { name: e.target.value })}
                    placeholder="Ingrediente"
                    className="w-full rounded-md border border-border bg-bg-elevated px-2 py-1.5 text-xs text-text pr-16"
                  />
                  {row.name.trim() && (
                    <span
                      className={`absolute right-1.5 text-[8.5px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                        isKnown ? "text-accent bg-accent-soft" : "text-[#d9b98f] bg-[#d9b98f22]"
                      }`}
                    >
                      {isKnown ? "existe" : "nueva"}
                    </span>
                  )}
                </div>
                <input
                  key={`${row.key}-oz`}
                  value={row.oz}
                  onChange={(e) => updateRow(row.key, { oz: e.target.value })}
                  placeholder="—"
                  inputMode="decimal"
                  className="w-full rounded-md border border-border bg-bg-elevated px-2 py-1.5 text-xs text-text text-right tabular-nums"
                />
                <input
                  key={`${row.key}-ml`}
                  value={m.ml !== null ? m.ml.toFixed(0) : ""}
                  disabled
                  placeholder="—"
                  className="w-full rounded-md border border-border-soft bg-transparent px-2 py-1.5 text-xs text-text-muted text-right tabular-nums"
                />
                <input
                  key={`${row.key}-gr`}
                  value={row.gr}
                  onChange={(e) => updateRow(row.key, { gr: e.target.value })}
                  placeholder="—"
                  inputMode="decimal"
                  className="w-full rounded-md border border-border bg-bg-elevated px-2 py-1.5 text-xs text-text text-right tabular-nums"
                />
                {isKnown ? (
                  <input
                    key={`${row.key}-cost`}
                    value={`${money(m.known!.costPerServing)}/u`}
                    disabled
                    title="Costo real cargado en Productos — no se edita acá"
                    className="w-full rounded-md border border-border-soft bg-transparent px-2 py-1.5 text-xs text-text-muted text-right tabular-nums"
                  />
                ) : (
                  <input
                    key={`${row.key}-cost`}
                    value={row.newCostPerUnit}
                    onChange={(e) => updateRow(row.key, { newCostPerUnit: e.target.value })}
                    placeholder="0.00"
                    inputMode="decimal"
                    className="w-full rounded-md border border-border bg-bg-elevated px-2 py-1.5 text-xs text-text text-right tabular-nums"
                  />
                )}
                <input
                  key={`${row.key}-cl`}
                  value={m.costoLiquidos > 0 ? money(m.costoLiquidos) : "—"}
                  disabled
                  className="w-full rounded-md border border-border-soft bg-transparent px-2 py-1.5 text-xs text-text-muted text-right tabular-nums"
                />
                <input
                  key={`${row.key}-cs`}
                  value={m.costoSolidos > 0 ? money(m.costoSolidos) : "—"}
                  disabled
                  className="w-full rounded-md border border-border-soft bg-transparent px-2 py-1.5 text-xs text-text-muted text-right tabular-nums"
                />
                <button
                  key={`${row.key}-del`}
                  onClick={() => removeRow(row.key)}
                  aria-label="Quitar ingrediente"
                  className="w-[26px] h-[26px] rounded-md border border-border text-text-faint text-xs"
                >
                  ✕
                </button>
              </Fragment>
            );
          })}
        </div>
      </div>

      <button
        onClick={addRow}
        className="mt-2.5 w-full text-left text-xs text-accent border border-dashed border-border rounded-md px-3 py-2"
      >
        + Agregar ingrediente
      </button>

      <div
        className="grid gap-x-2 mt-3 pt-2.5 border-t border-border text-xs font-bold tabular-nums min-w-[640px]"
        style={{ gridTemplateColumns: "1.9fr 0.7fr 0.6fr 0.7fr 0.95fr 0.85fr 0.85fr 28px" }}
      >
        <span>Total</span>
        <span className="text-right">{totals.oz.toFixed(2)}</span>
        <span className="text-right">{totals.ml.toFixed(0)}</span>
        <span className="text-right">{totals.gr.toFixed(2)}</span>
        <span></span>
        <span className="text-right">{money(totals.costoLiquidos)}</span>
        <span className="text-right">{money(totals.costoSolidos)}</span>
        <span></span>
      </div>

      <div className="flex items-baseline justify-between mt-4 px-3.5 py-3 rounded-lg bg-accent-soft border border-accent/25">
        <span className="text-[11.5px] font-bold uppercase tracking-wide text-accent">Costo total de la bebida</span>
        <span className="text-lg font-bold text-text tabular-nums">{money(grandTotal)}</span>
      </div>

      <button
        disabled={isPending}
        onClick={handleSave}
        className="w-full mt-4 rounded-lg bg-accent text-bg font-semibold py-2.5 text-sm disabled:opacity-50"
      >
        {saved ? "Guardado ✓" : "Guardar"}
      </button>
    </Card>
  );
}
