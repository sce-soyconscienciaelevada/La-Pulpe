type Category = { id: string; name: string };
type Supplier = { id: string; name: string };

export type ProductFormValues = {
  name: string;
  categoryId: string;
  containerLabel: string | null;
  servingsPerContainer: number;
  costPricePerContainer: number;
  salePricePerServing: number | null;
  carbonation: "CON_GAS" | "SIN_GAS" | "NA";
  emoji: string | null;
  colorHex: string | null;
  showOnQuickGrid: boolean;
  primarySupplierId: string | null;
  reorderThreshold: number | null;
};

export function ProductForm({
  action,
  categories,
  suppliers,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  categories: Category[];
  suppliers: Supplier[];
  initial?: Partial<ProductFormValues>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="grid sm:grid-cols-2 gap-3">
      <label className="text-sm text-text-muted sm:col-span-2">
        Nombre
        <input
          name="name"
          required
          defaultValue={initial?.name}
          className="mt-1 w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-base text-text"
        />
      </label>

      <label className="text-sm text-text-muted">
        Categoría
        <select
          name="categoryId"
          required
          defaultValue={initial?.categoryId}
          className="mt-1 w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-base text-text"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm text-text-muted">
        Proveedor
        <select
          name="primarySupplierId"
          defaultValue={initial?.primarySupplierId ?? ""}
          className="mt-1 w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-base text-text"
        >
          <option value="">—</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm text-text-muted">
        Envase (ej: 750ml)
        <input
          name="containerLabel"
          defaultValue={initial?.containerLabel ?? ""}
          className="mt-1 w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-base text-text"
        />
      </label>

      <label className="text-sm text-text-muted">
        Medidas por envase
        <input
          name="servingsPerContainer"
          type="number"
          step="0.01"
          defaultValue={initial?.servingsPerContainer ?? 1}
          className="mt-1 w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-base text-text"
        />
      </label>

      <label className="text-sm text-text-muted">
        Costo por envase ($)
        <input
          name="costPricePerContainer"
          type="number"
          step="0.01"
          defaultValue={initial?.costPricePerContainer ?? 0}
          className="mt-1 w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-base text-text"
        />
      </label>

      <label className="text-sm text-text-muted">
        Precio de venta por medida ($)
        <input
          name="salePricePerServing"
          type="number"
          step="0.01"
          defaultValue={initial?.salePricePerServing ?? ""}
          placeholder="sin precio todavía"
          className="mt-1 w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-base text-text"
        />
      </label>

      <label className="text-sm text-text-muted">
        Gas
        <select
          name="carbonation"
          defaultValue={initial?.carbonation ?? "NA"}
          className="mt-1 w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-base text-text"
        >
          <option value="NA">N/A</option>
          <option value="CON_GAS">Con gas</option>
          <option value="SIN_GAS">Sin gas</option>
        </select>
      </label>

      <label className="text-sm text-text-muted">
        Umbral de reposición
        <input
          name="reorderThreshold"
          type="number"
          step="0.1"
          defaultValue={initial?.reorderThreshold ?? ""}
          className="mt-1 w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-base text-text"
        />
      </label>

      <label className="text-sm text-text-muted">
        Emoji para Registro
        <input
          name="emoji"
          defaultValue={initial?.emoji ?? ""}
          placeholder="🍺"
          className="mt-1 w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-base text-text"
        />
      </label>

      <label className="text-sm text-text-muted">
        Color (hex)
        <input
          name="colorHex"
          defaultValue={initial?.colorHex ?? "#c89b3c"}
          className="mt-1 w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-base text-text"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-text sm:col-span-2 mt-1">
        <input type="checkbox" name="showOnQuickGrid" defaultChecked={initial?.showOnQuickGrid} />
        Mostrar en la grilla rápida de Registro diario
      </label>

      <button
        type="submit"
        className="sm:col-span-2 rounded-lg bg-accent text-bg font-semibold py-2.5 text-sm mt-2"
      >
        {submitLabel}
      </button>
    </form>
  );
}
