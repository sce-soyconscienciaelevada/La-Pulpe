"use client";

import { useState, useTransition } from "react";
import { saveRecipe, deleteRecipe } from "./actions";
import { Card, formatARS } from "@/components/ui";
import { ProductIcon } from "@/components/ProductIcon";

type IngredientOption = { id: string; name: string };
type ExistingRecipe = {
  productId: string;
  productName: string;
  productCategoryName: string | null;
  yieldServings: number;
  costPerServing: number;
  salePricePerServing: number | null;
  ingredients: { ingredientProductId: string; name: string; quantity: number }[];
};

export function RecipeEditor({
  candidateProducts,
  ingredientOptions,
  existingRecipes,
}: {
  candidateProducts: { id: string; name: string }[];
  ingredientOptions: IngredientOption[];
  existingRecipes: ExistingRecipe[];
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {existingRecipes.map((r) => (
          <Card key={r.productId}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-text flex items-center gap-2">
                <ProductIcon categoryName={r.productCategoryName} className="inline-block w-4 h-4 shrink-0 text-text-muted" />
                {r.productName}
              </h3>
              <button
                onClick={() => deleteRecipe(r.productId)}
                className="text-loss text-xs underline"
              >
                eliminar receta
              </button>
            </div>
            <ul className="text-sm text-text-muted mb-2">
              {r.ingredients.map((i) => (
                <li key={i.ingredientProductId}>
                  {i.quantity} medida(s) de {i.name}
                </li>
              ))}
            </ul>
            <div className="flex gap-4 text-sm">
              <span className="text-text-muted">
                Costo: <span className="text-text font-medium">{formatARS(r.costPerServing)}</span>
              </span>
              <span className="text-text-muted">
                Venta:{" "}
                <span className="text-text font-medium">
                  {r.salePricePerServing !== null ? formatARS(r.salePricePerServing) : "sin precio"}
                </span>
              </span>
            </div>
          </Card>
        ))}
      </div>

      <NewRecipeForm candidateProducts={candidateProducts} ingredientOptions={ingredientOptions} />
    </div>
  );
}

function NewRecipeForm({
  candidateProducts,
  ingredientOptions,
}: {
  candidateProducts: { id: string; name: string }[];
  ingredientOptions: IngredientOption[];
}) {
  const [productId, setProductId] = useState("");
  const [yieldServings, setYieldServings] = useState(1);
  const [rows, setRows] = useState<{ ingredientProductId: string; quantity: number }[]>([
    { ingredientProductId: "", quantity: 1 },
  ]);
  const [isPending, startTransition] = useTransition();

  if (candidateProducts.length === 0) {
    return (
      <Card>
        <p className="text-sm text-text-muted">
          Todos los productos vendibles ya tienen receta, o creá uno nuevo en Productos primero.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="font-semibold text-text mb-3">Nueva receta</h2>
      <select
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
        className="w-full mb-3 rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text"
      >
        <option value="">Producto...</option>
        {candidateProducts.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <div className="space-y-2 mb-3">
        {rows.map((row, idx) => (
          <div key={idx} className="flex gap-2">
            <select
              value={row.ingredientProductId}
              onChange={(e) => {
                const next = [...rows];
                next[idx] = { ...row, ingredientProductId: e.target.value };
                setRows(next);
              }}
              className="flex-1 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text"
            >
              <option value="">Ingrediente...</option>
              {ingredientOptions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={row.quantity}
              onChange={(e) => {
                const next = [...rows];
                next[idx] = { ...row, quantity: Number(e.target.value) || 1 };
                setRows(next);
              }}
              className="w-20 rounded-lg border border-border bg-bg-elevated px-2 py-2 text-sm text-text"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setRows([...rows, { ingredientProductId: "", quantity: 1 }])}
          className="text-sm text-accent underline"
        >
          + agregar ingrediente
        </button>
        <label className="ml-auto text-sm text-text-muted flex items-center gap-2">
          Rinde
          <input
            type="number"
            min="1"
            value={yieldServings}
            onChange={(e) => setYieldServings(Number(e.target.value) || 1)}
            className="w-14 rounded-lg border border-border bg-bg-elevated px-2 py-1 text-sm text-text"
          />
          medida(s)
        </label>
      </div>

      <button
        disabled={isPending || !productId}
        onClick={() =>
          startTransition(async () => {
            await saveRecipe(productId, yieldServings, rows);
            setProductId("");
            setRows([{ ingredientProductId: "", quantity: 1 }]);
          })
        }
        className="w-full rounded-lg bg-accent text-bg font-semibold py-2.5 text-sm disabled:opacity-50"
      >
        Guardar receta
      </button>
    </Card>
  );
}
