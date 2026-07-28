"use client";

import { useMemo, useState } from "react";

type ProductOption = { id: string; name: string; posCode: string | null };

export function ProductPicker({
  products,
  selectedId,
  selectedName,
  onSelect,
  onClear,
}: {
  products: ProductOption[];
  selectedId: string | null;
  selectedName: string | null;
  onSelect: (id: string, name: string) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 15);
  }, [products, query]);

  if (selectedId && !open) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text">
        <span className="flex-1 truncate">🔗 {selectedName}</span>
        <button type="button" onClick={() => setOpen(true)} className="text-accent underline shrink-0">
          cambiar
        </button>
        <button type="button" onClick={onClear} className="text-text-muted shrink-0">
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar producto para vincular..."
        className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text"
      />
      {matches.length > 0 && (
        <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-border bg-bg-card">
          {matches.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onSelect(p.id, p.name);
                setQuery("");
                setOpen(false);
              }}
              className="block w-full text-left px-3 py-2 text-sm text-text hover:bg-bg-elevated"
            >
              {p.name}
              {p.posCode && <span className="text-text-muted"> ({p.posCode})</span>}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          onClear();
          setOpen(false);
          setQuery("");
        }}
        className="mt-1 text-xs text-text-muted underline"
      >
        Sin producto vinculado (código de combo/promo)
      </button>
    </div>
  );
}
