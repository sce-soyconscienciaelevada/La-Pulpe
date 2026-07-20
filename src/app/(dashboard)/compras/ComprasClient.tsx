"use client";

import { useTransition } from "react";
import { logPurchase, updateReorderStatus } from "./actions";
import { Card, Badge } from "@/components/ui";

type Product = { id: string; name: string; emoji: string | null; costPricePerContainer: number };
type Supplier = { id: string; name: string };
type ReorderRow = {
  id: string;
  name: string;
  quantity: number;
  status: "PENDIENTE" | "PEDIDO" | "RECIBIDO";
  supplierLabel: string | null;
  createdAt: string;
};

export function ComprasClient({
  products,
  suppliers,
  reorderItems,
}: {
  products: Product[];
  suppliers: Supplier[];
  reorderItems: ReorderRow[];
}) {
  const [isPending, startTransition] = useTransition();
  const nextStatus: Record<string, "PENDIENTE" | "PEDIDO" | "RECIBIDO"> = {
    PENDIENTE: "PEDIDO",
    PEDIDO: "RECIBIDO",
    RECIBIDO: "PENDIENTE",
  };

  const grouped = new Map<string, ReorderRow[]>();
  for (const item of reorderItems) {
    const key = item.supplierLabel ?? "Sin proveedor";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  }

  return (
    <div className="space-y-5">
      <Card>
        <h2 className="font-semibold text-text mb-3">Registrar compra</h2>
        <form action={logPurchase} className="grid sm:grid-cols-2 gap-3">
          <select
            name="productId"
            required
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text"
          >
            <option value="">Producto...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.emoji} {p.name}
              </option>
            ))}
          </select>
          <select
            name="supplierId"
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text"
          >
            <option value="">Proveedor (opcional)...</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            name="quantity"
            type="number"
            step="0.1"
            min="0.1"
            required
            placeholder="Cantidad (botellas/unidades)"
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text"
          />
          <input
            name="unitCost"
            type="number"
            step="0.01"
            required
            placeholder="Costo unitario ($)"
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text"
          />
          <input
            name="invoiceRef"
            placeholder="Nº factura (opcional)"
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text sm:col-span-2"
          />
          <button
            type="submit"
            className="sm:col-span-2 rounded-lg bg-accent text-bg font-semibold py-2.5 text-sm"
          >
            Registrar compra
          </button>
        </form>
      </Card>

      <div>
        <h2 className="font-semibold text-text mb-3">Pedidos ({reorderItems.length})</h2>
        <div className="space-y-3">
          {Array.from(grouped.entries()).map(([supplier, items]) => (
            <Card key={supplier}>
              <h3 className="font-medium text-text mb-2">{supplier}</h3>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-sm gap-2">
                    <span className="text-text truncate">
                      {item.name} × {item.quantity}
                    </span>
                    <button
                      disabled={isPending}
                      onClick={() =>
                        startTransition(() => updateReorderStatus(item.id, nextStatus[item.status]))
                      }
                    >
                      <Badge
                        tone={
                          item.status === "RECIBIDO"
                            ? "profit"
                            : item.status === "PEDIDO"
                              ? "comp"
                              : "default"
                        }
                      >
                        {item.status}
                      </Badge>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
          {reorderItems.length === 0 && (
            <p className="text-sm text-text-muted">
              Sin pedidos pendientes — se agregan desde Registro diario → Pedido.
            </p>
          )}
        </div>
        {reorderItems.length > 0 && (
          <a
            href="/api/reportes/pedido"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block rounded-lg border border-border text-text px-4 py-2.5 text-sm"
          >
            🖨️ Exportar pedido en PDF
          </a>
        )}
      </div>
    </div>
  );
}
