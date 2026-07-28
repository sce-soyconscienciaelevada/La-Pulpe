"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, Table, Badge } from "@/components/ui";
import { POS_CATEGORIAS_CONOCIDAS } from "@/lib/ventas-pos-shared";
import {
  createPeriodAction,
  addLineAction,
  deleteLineAction,
  updateCategoryTicketTotal,
  updatePeriodTotalUnidades,
  closePeriodAction,
  lookupKnownCode,
} from "./actions";
import { ProductPicker } from "./ProductPicker";

type Line = {
  id: string;
  posCode: string;
  descripcion: string;
  unidadesVendidas: number;
  productId: string | null;
  productName: string | null;
};
type CategoryData = { id: string; name: string; totalTicket: number | null; lines: Line[] };
type ProductOption = { id: string; name: string; posCode: string | null };

function CrossCheckBadge({ actual, expected }: { actual: number; expected: number | null }) {
  if (expected === null) return <Badge>sin total impreso</Badge>;
  const matches = Math.abs(actual - expected) < 0.001;
  return matches ? (
    <Badge tone="profit">✓ coincide ({actual})</Badge>
  ) : (
    <Badge tone="loss">⚠ no coincide (cargado {actual}, esperado {expected})</Badge>
  );
}

export function VentasPosClient({
  venueId,
  openPeriod,
  categories,
  products,
}: {
  venueId: string;
  openPeriod: { id: string; label: string; totalUnidades: number | null } | null;
  categories: CategoryData[];
  products: ProductOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!openPeriod) {
    return <NewPeriodForm venueId={venueId} onCreated={() => router.refresh()} />;
  }

  const grandTotal = categories.reduce(
    (sum, c) => sum + c.lines.reduce((s, l) => s + l.unidadesVendidas, 0),
    0
  );

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div>
            <div className="font-semibold text-text">{openPeriod.label}</div>
            <div className="text-sm text-text-muted mt-1">
              Total cargado: {grandTotal} unidades
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="1"
              defaultValue={openPeriod.totalUnidades ?? ""}
              onBlur={(e) => {
                const v = e.target.value === "" ? null : Number(e.target.value);
                startTransition(async () => {
                  await updatePeriodTotalUnidades(openPeriod.id, v);
                  router.refresh();
                });
              }}
              placeholder="Total impreso (TOTALES)"
              className="w-40 rounded-lg border border-border bg-bg-elevated px-2 py-1.5 text-sm text-text"
            />
            <CrossCheckBadge actual={grandTotal} expected={openPeriod.totalUnidades} />
            <button
              disabled={isPending}
              onClick={() => {
                if (!confirm(`¿Cerrar "${openPeriod.label}"? No se puede reabrir.`)) return;
                startTransition(async () => {
                  await closePeriodAction(openPeriod.id);
                  router.refresh();
                });
              }}
              className="rounded-lg bg-accent text-bg font-semibold px-3 py-1.5 text-sm"
            >
              Cerrar período
            </button>
          </div>
        </div>
      </Card>

      <AddLineForm periodId={openPeriod.id} products={products} onDone={() => router.refresh()} />

      {categories.map((cat) => {
        const catTotal = cat.lines.reduce((s, l) => s + l.unidadesVendidas, 0);
        return (
          <Card key={cat.id}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-semibold text-text">{cat.name}</h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="1"
                  defaultValue={cat.totalTicket ?? ""}
                  onBlur={(e) => {
                    const v = e.target.value === "" ? null : Number(e.target.value);
                    startTransition(async () => {
                      await updateCategoryTicketTotal(cat.id, v);
                      router.refresh();
                    });
                  }}
                  placeholder="Total impreso"
                  className="w-32 rounded-lg border border-border bg-bg-elevated px-2 py-1 text-sm text-text"
                />
                <CrossCheckBadge actual={catTotal} expected={cat.totalTicket} />
              </div>
            </div>
            <Table>
              <thead>
                <tr className="text-left text-xs text-text-muted border-b border-border">
                  <th className="px-3 py-2">Código</th>
                  <th className="px-3 py-2">Descripción</th>
                  <th className="px-3 py-2">Unidades</th>
                  <th className="px-3 py-2">% categoría</th>
                  <th className="px-3 py-2">Producto</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {cat.lines.map((line) => (
                  <tr key={line.id} className="border-b border-border">
                    <td className="px-3 py-2 text-text-muted whitespace-nowrap">{line.posCode}</td>
                    <td className="px-3 py-2 text-text">{line.descripcion}</td>
                    <td className="px-3 py-2 text-text">{line.unidadesVendidas}</td>
                    <td className="px-3 py-2 text-text-muted">
                      {catTotal ? `${((line.unidadesVendidas / catTotal) * 100).toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-3 py-2 text-text-muted">
                      {line.productName ?? <span className="italic">sin vincular</span>}
                    </td>
                    <td className="px-2 py-2">
                      <button
                        disabled={isPending}
                        onClick={() => {
                          if (!confirm(`¿Eliminar "${line.descripcion}"?`)) return;
                          startTransition(async () => {
                            await deleteLineAction(line.id);
                            router.refresh();
                          });
                        }}
                        className="text-text-muted text-sm"
                        aria-label="Eliminar"
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
      })}
    </div>
  );
}

function NewPeriodForm({ venueId, onCreated }: { venueId: string; onCreated: () => void }) {
  const [label, setLabel] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <h3 className="font-semibold text-text mb-3">+ Nuevo período de ventas</h3>
      {error && <p className="text-sm text-loss mb-2">{error}</p>}
      <div className="grid sm:grid-cols-3 gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder='Etiqueta (ej: "18/07 a 25/07")'
          className="sm:col-span-3 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text"
        />
        <input
          type="datetime-local"
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
          className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text"
        />
        <input
          type="datetime-local"
          value={endAt}
          onChange={(e) => setEndAt(e.target.value)}
          className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text"
        />
        <button
          disabled={isPending || !label.trim() || !startAt || !endAt}
          onClick={() =>
            startTransition(async () => {
              const res = await createPeriodAction({ venueId, label, startAt, endAt });
              if (res?.error) setError(res.error);
              else onCreated();
            })
          }
          className="rounded-lg bg-accent text-bg font-semibold py-2 text-sm disabled:opacity-50"
        >
          Crear período
        </button>
      </div>
    </Card>
  );
}

function AddLineForm({
  periodId,
  products,
  onDone,
}: {
  periodId: string;
  products: ProductOption[];
  onDone: () => void;
}) {
  const [categoryName, setCategoryName] = useState(POS_CATEGORIAS_CONOCIDAS[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [posCode, setPosCode] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [unidades, setUnidades] = useState("");
  const [productId, setProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const finalCategory = categoryName === "__otra__" ? customCategory : categoryName;

  function submit(forceRelink: boolean) {
    startTransition(async () => {
      const res = await addLineAction({
        periodId,
        categoryName: finalCategory,
        posCode,
        descripcion,
        unidadesVendidas: Number(unidades) || 0,
        productId,
        forceRelink,
      });
      if (res?.warning) {
        setWarning(res.warning);
        return;
      }
      if (res?.error) {
        setWarning(res.error);
        return;
      }
      setPosCode("");
      setDescripcion("");
      setUnidades("");
      setProductId(null);
      setProductName(null);
      setWarning(null);
      onDone();
    });
  }

  return (
    <Card>
      <h3 className="font-semibold text-text mb-3">+ Cargar línea</h3>
      {warning && (
        <div className="mb-3 rounded-lg border border-loss/40 bg-loss/10 p-3 text-sm text-text">
          <p className="mb-2">{warning}</p>
          <button
            onClick={() => submit(true)}
            disabled={isPending}
            className="rounded-lg bg-loss text-white px-3 py-1 text-xs font-semibold"
          >
            Confirmar igual
          </button>
        </div>
      )}
      <div className="grid sm:grid-cols-4 gap-2">
        <select
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text"
        >
          {POS_CATEGORIAS_CONOCIDAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          <option value="__otra__">+ otra categoría…</option>
        </select>
        {categoryName === "__otra__" && (
          <input
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="Nombre de la categoría"
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text"
          />
        )}
        <input
          value={posCode}
          onChange={(e) => setPosCode(e.target.value)}
          onBlur={async () => {
            if (!posCode.trim() || descripcion.trim()) return;
            const known = await lookupKnownCode(posCode);
            if (known) {
              setDescripcion(known.descripcion);
              if (known.productId && known.productName) {
                setProductId(known.productId);
                setProductName(known.productName);
              }
            }
          }}
          placeholder="Código POS"
          className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text"
        />
        <input
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción"
          className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text sm:col-span-2"
        />
        <input
          type="number"
          step="1"
          value={unidades}
          onChange={(e) => setUnidades(e.target.value)}
          placeholder="Unidades vendidas"
          className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text"
        />
        <div className="sm:col-span-4">
          <ProductPicker
            products={products}
            selectedId={productId}
            selectedName={productName}
            onSelect={(id, name) => {
              setProductId(id);
              setProductName(name);
            }}
            onClear={() => {
              setProductId(null);
              setProductName(null);
            }}
          />
        </div>
        <button
          disabled={isPending || !finalCategory.trim() || !posCode.trim() || !descripcion.trim()}
          onClick={() => submit(false)}
          className="sm:col-span-4 rounded-lg bg-accent text-bg font-semibold py-2 text-sm disabled:opacity-50"
        >
          Cargar línea
        </button>
      </div>
    </Card>
  );
}
