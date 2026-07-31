"use client";

import { useState, useTransition } from "react";
import {
  tapConsumption,
  addFreeTextConsumption,
  addOwner,
  addReorderItem,
  closeDayAction,
  clearDayAction,
} from "./actions";
import { Card, Badge, formatARS } from "@/components/ui";
import { ProductIcon } from "@/components/ProductIcon";

type QuickProduct = {
  id: string;
  name: string;
  categoryName: string | null;
  colorHex: string | null;
};

type Owner = { id: string; name: string };
type Supplier = { id: string; name: string };

type ConsumptionRow = {
  id: string;
  type: "SALE" | "OWNER" | "COMP" | "BAND_ALLOWANCE";
  quantity: number;
  unitPriceCharged: number;
  unitCost: number;
  productName: string | null;
  freeText: string | null;
  personName: string | null;
};

type ReorderRow = { id: string; name: string; quantity: number; supplierLabel: string | null };

const TABS = ["Dueños", "Consumiciones", "Cortesía", "Pedido", "Resumen"] as const;
type Tab = (typeof TABS)[number];

export function RegistroTabs({
  quickProducts,
  owners,
  suppliers,
  consumptions,
  reorderItems,
  revenue,
  profit,
  dayStatus,
}: {
  quickProducts: QuickProduct[];
  owners: Owner[];
  suppliers: Supplier[];
  consumptions: ConsumptionRow[];
  reorderItems: ReorderRow[];
  revenue: number;
  profit: number;
  dayStatus: "OPEN" | "CLOSED";
}) {
  const [tab, setTab] = useState<Tab>("Consumiciones");
  const [isPending, startTransition] = useTransition();

  const byType = {
    OWNER: consumptions.filter((c) => c.type === "OWNER"),
    SALE: consumptions.filter((c) => c.type === "SALE"),
    COMP: consumptions.filter((c) => c.type === "COMP"),
  };

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto border-b border-border mb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2.5 text-sm whitespace-nowrap border-b-2 ${
              tab === t ? "border-accent text-accent font-medium" : "border-transparent text-text-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {dayStatus === "CLOSED" && (
        <Badge tone="loss">Día cerrado — reabrí desde Reportes si necesitás editar</Badge>
      )}

      {tab === "Dueños" && (
        <OwnersTab owners={owners} items={byType.OWNER} isPending={isPending} startTransition={startTransition} />
      )}
      {tab === "Consumiciones" && (
        <QuickGridTab
          title="Tragos cobrados"
          type="SALE"
          quickProducts={quickProducts}
          items={byType.SALE}
          isPending={isPending}
          startTransition={startTransition}
        />
      )}
      {tab === "Cortesía" && (
        <QuickGridTab
          title="Invitados · sin cargo"
          type="COMP"
          quickProducts={quickProducts}
          items={byType.COMP}
          isPending={isPending}
          startTransition={startTransition}
        />
      )}
      {tab === "Pedido" && (
        <PedidoTab suppliers={suppliers} items={reorderItems} isPending={isPending} startTransition={startTransition} />
      )}
      {tab === "Resumen" && (
        <ResumenTab
          byType={byType}
          revenue={revenue}
          profit={profit}
          isPending={isPending}
          startTransition={startTransition}
        />
      )}
    </div>
  );
}

function OwnersTab({
  owners,
  items,
  isPending,
  startTransition,
}: {
  owners: Owner[];
  items: ConsumptionRow[];
  isPending: boolean;
  startTransition: (fn: () => void) => void;
}) {
  const [newOwner, setNewOwner] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-muted">Qué y cuánto tomó cada uno</p>
      {owners.map((o) => {
        const ownerItems = items.filter((i) => i.personName === o.name);
        return (
          <Card key={o.id}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 rounded-full bg-accent-soft text-accent flex items-center justify-center text-sm font-semibold">
                {o.name[0]}
              </span>
              <span className="font-medium text-text">{o.name}</span>
            </div>
            {ownerItems.length === 0 ? (
              <p className="text-xs text-text-muted mb-2">Nada todavía</p>
            ) : (
              <ul className="text-sm text-text mb-2 space-y-1">
                {ownerItems.map((i) => (
                  <li key={i.id}>
                    {i.productName ?? i.freeText} × {i.quantity}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <input
                value={drafts[o.id] ?? ""}
                onChange={(e) => setDrafts({ ...drafts, [o.id]: e.target.value })}
                placeholder="Qué tomó..."
                className="flex-1 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text outline-none focus:border-accent"
              />
              <button
                disabled={isPending}
                onClick={() =>
                  startTransition(() => {
                    addFreeTextConsumption(drafts[o.id] ?? "", 1, "OWNER", o.id);
                    setDrafts({ ...drafts, [o.id]: "" });
                  })
                }
                className="w-9 h-9 rounded-lg bg-loss text-white font-bold shrink-0"
              >
                +
              </button>
            </div>
          </Card>
        );
      })}
      <div className="flex gap-2">
        <input
          value={newOwner}
          onChange={(e) => setNewOwner(e.target.value)}
          placeholder="Nombre del dueño..."
          className="flex-1 rounded-lg border border-border bg-bg-card px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
        />
        <button
          disabled={isPending}
          onClick={() =>
            startTransition(() => {
              addOwner(newOwner);
              setNewOwner("");
            })
          }
          className="rounded-lg border border-border px-4 py-2.5 text-sm text-text-muted"
        >
          + Agregar dueño
        </button>
      </div>
    </div>
  );
}

function QuickGridTab({
  title,
  type,
  quickProducts,
  items,
  isPending,
  startTransition,
}: {
  title: string;
  type: "SALE" | "COMP";
  quickProducts: QuickProduct[];
  items: ConsumptionRow[];
  isPending: boolean;
  startTransition: (fn: () => void) => void;
}) {
  const [freeText, setFreeText] = useState("");
  const [qty, setQty] = useState(1);

  const countFor = (name: string) =>
    items.filter((i) => i.productName === name).reduce((s, i) => s + i.quantity, 0);

  return (
    <div>
      <p className="text-sm text-text-muted mb-3">{title}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {quickProducts.map((p) => (
          <button
            key={p.id}
            disabled={isPending}
            onClick={() => startTransition(() => tapConsumption(p.id, type))}
            className="bg-bg-card border-t-2 rounded-xl px-3 py-4 text-center hover:bg-bg-elevated active:scale-95 transition"
            style={{ borderTopColor: p.colorHex ?? "#c89b3c" }}
          >
            <ProductIcon categoryName={p.categoryName} className="inline-block w-7 h-7 mb-1 text-text-muted" />
            <div className="text-xs text-text mb-1 truncate">{p.name}</div>
            <div className="text-lg font-bold text-text">{countFor(p.name)}</div>
          </button>
        ))}
      </div>
      <div className="flex gap-2 items-center">
        <input
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder="Ej: Aperol Spritz..."
          className="flex-1 rounded-lg border border-border bg-bg-card px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
        />
        <div className="flex items-center border border-border rounded-lg">
          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="w-9 h-10 text-text-muted"
          >
            −
          </button>
          <span className="w-8 text-center text-sm text-text">{qty}</span>
          <button onClick={() => setQty(qty + 1)} className="w-9 h-10 text-text-muted">
            +
          </button>
        </div>
        <button
          disabled={isPending}
          onClick={() =>
            startTransition(() => {
              addFreeTextConsumption(freeText, qty, type);
              setFreeText("");
              setQty(1);
            })
          }
          className="rounded-lg bg-accent text-bg font-semibold px-4 py-2.5 text-sm shrink-0"
        >
          + Agregar
        </button>
      </div>
    </div>
  );
}

function PedidoTab({
  suppliers,
  items,
  isPending,
  startTransition,
}: {
  suppliers: Supplier[];
  items: ReorderRow[];
  isPending: boolean;
  startTransition: (fn: () => void) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, { name: string; qty: number }>>({});

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-muted">Lo que hay que pedir</p>
      {suppliers.map((s) => {
        const supplierItems = items.filter((i) => i.supplierLabel === s.name);
        const draft = drafts[s.id] ?? { name: "", qty: 1 };
        return (
          <Card key={s.id}>
            <h3 className="font-medium text-text mb-2">{s.name}</h3>
            {supplierItems.length === 0 ? (
              <p className="text-xs text-text-muted mb-2">Lista vacía</p>
            ) : (
              <ul className="text-sm text-text mb-2 space-y-1">
                {supplierItems.map((i) => (
                  <li key={i.id}>
                    {i.name} × {i.quantity}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <input
                value={draft.name}
                onChange={(e) => setDrafts({ ...drafts, [s.id]: { ...draft, name: e.target.value } })}
                placeholder="Ej: Fernet 1L..."
                className="flex-1 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text outline-none focus:border-accent"
              />
              <input
                type="number"
                min={1}
                value={draft.qty}
                onChange={(e) =>
                  setDrafts({ ...drafts, [s.id]: { ...draft, qty: Number(e.target.value) || 1 } })
                }
                className="w-16 rounded-lg border border-border bg-bg-elevated px-2 py-2 text-sm text-text outline-none focus:border-accent"
              />
            </div>
            <button
              disabled={isPending}
              onClick={() =>
                startTransition(() => {
                  addReorderItem(draft.name, draft.qty, s.id, s.name);
                  setDrafts({ ...drafts, [s.id]: { name: "", qty: 1 } });
                })
              }
              className="mt-2 w-full rounded-lg bg-comp text-white font-medium py-2 text-sm"
            >
              + Agregar
            </button>
          </Card>
        );
      })}
    </div>
  );
}

function ResumenTab({
  byType,
  revenue,
  profit,
  isPending,
  startTransition,
}: {
  byType: { OWNER: ConsumptionRow[]; SALE: ConsumptionRow[]; COMP: ConsumptionRow[] };
  revenue: number;
  profit: number;
  isPending: boolean;
  startTransition: (fn: () => void) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-text-muted">Cierre del día</p>
      <div className="grid grid-cols-3 gap-2">
        <Card className="text-center">
          <div className="text-xs text-text-muted mb-1">DUEÑOS</div>
          <div className="text-2xl font-bold text-loss">{byType.OWNER.length}</div>
        </Card>
        <Card className="text-center">
          <div className="text-xs text-text-muted mb-1">CONSUM.</div>
          <div className="text-2xl font-bold text-accent">{byType.SALE.length}</div>
        </Card>
        <Card className="text-center">
          <div className="text-xs text-text-muted mb-1">CORTESÍA</div>
          <div className="text-2xl font-bold text-profit">{byType.COMP.length}</div>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-text-muted">Ventas del día</span>
          <span className="text-text font-semibold">{formatARS(revenue)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Ganancia del día</span>
          <span className={`font-semibold ${profit >= 0 ? "text-profit" : "text-loss"}`}>
            {formatARS(profit)}
          </span>
        </div>
      </Card>

      {(["OWNER", "SALE", "COMP"] as const).map((key) => (
        <Card key={key}>
          <h4 className="text-xs uppercase tracking-wide text-text-muted mb-2">
            {key === "OWNER" ? "Consumo dueños" : key === "SALE" ? "Consumiciones" : "Cortesía"}
          </h4>
          {byType[key].length === 0 ? (
            <p className="text-xs text-text-muted">Sin registros</p>
          ) : (
            <ul className="text-sm text-text space-y-1">
              {byType[key].map((i) => (
                <li key={i.id} className="flex justify-between">
                  <span>{i.productName ?? i.freeText}</span>
                  <span>{i.quantity}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}

      <a
        href="/api/reportes/cierre-dia"
        target="_blank"
        rel="noreferrer"
        className="block text-center rounded-lg bg-profit text-white font-semibold py-3"
      >
        🖨️ Exportar PDF
      </a>
      <button
        disabled={isPending}
        onClick={() => {
          if (confirm("¿Cerrar el día? Podés seguir viendo el resumen pero no se podrán agregar más consumiciones.")) {
            startTransition(() => closeDayAction());
          }
        }}
        className="w-full rounded-lg border border-border text-text font-medium py-3"
      >
        Cerrar día
      </button>
      <button
        disabled={isPending}
        onClick={() => {
          if (confirm("¿Borrar todo el día? Esta acción no se puede deshacer y repone el stock descontado.")) {
            startTransition(() => clearDayAction());
          }
        }}
        className="w-full text-center text-text-muted text-sm py-2"
      >
        Borrar todo el día
      </button>
    </div>
  );
}
