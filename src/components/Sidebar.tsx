"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { SignOutButton } from "./SignOutButton";
import { NotificationsBell } from "./NotificationsBell";

// Inline SVG line icons, ported from the approved mockup
// (_design/dashboards/barmgmt-premium/pages/mockup-d-salon.html) —
// no external requests, replaces the 18 emoji flagged as the single
// biggest "hobby project" signal in the original gap analysis.
// An <svg> with no width/height defaults to a fixed intrinsic box (commonly
// 300x150) regardless of its parent container size — wrapping it in a sized
// span alone does nothing. width/height=16 sets a sane default; w-full h-full
// lets a differently-sized wrapper (the search icon is used at 3 sizes)
// actually resize it.
function svgProps() {
  return {
    viewBox: "0 0 24 24",
    width: 16,
    height: 16,
    className: "w-full h-full",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

const Icon = {
  Inicio: () => (
    <svg {...svgProps()}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  ),
  Registro: () => (
    <svg {...svgProps()}>
      <path d="M8 4h8v3H8z" />
      <path d="M6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z" />
      <path d="M9.5 12h5M9.5 16h5" />
    </svg>
  ),
  Barra: () => (
    <svg {...svgProps()}>
      <path d="M10 3h4v3.5l2.5 4V20a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-9.5L10 6.5z" />
      <path d="M7.5 14h9" />
    </svg>
  ),
  Inventario: () => (
    <svg {...svgProps()}>
      <path d="M3 7.5 12 3l9 4.5-9 4.5z" />
      <path d="M3 7.5V16l9 4.5 9-4.5V7.5" />
      <path d="M12 12v8.5" />
    </svg>
  ),
  StockSemanal: () => (
    <svg {...svgProps()}>
      <rect x="3.5" y="5" width="17" height="16" rx="1.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  ),
  Cristaleria: () => (
    <svg {...svgProps()}>
      <path d="M7 4h10l-1 5a4 4 0 0 1-8 0z" />
      <path d="M12 13v7M8.5 20h7" />
    </svg>
  ),
  Heladeras: () => (
    <svg {...svgProps()}>
      <path d="M12 3a2 2 0 0 1 2 2v8.2a4 4 0 1 1-4 0V5a2 2 0 0 1 2-2z" />
      <path d="M12 9v7" />
    </svg>
  ),
  Compras: () => (
    <svg {...svgProps()}>
      <path d="M2.5 7h11v9h-11z" />
      <path d="M13.5 11h4l3 3v2h-7z" />
      <circle cx="6.5" cy="18" r="1.6" />
      <circle cx="16.5" cy="18" r="1.6" />
    </svg>
  ),
  Productos: () => (
    <svg {...svgProps()}>
      <path d="M4 12.5V5a1 1 0 0 1 1-1h7.5l7 7-8.5 8.5z" />
      <circle cx="8.5" cy="8.5" r="1.4" />
    </svg>
  ),
  Costeo: () => (
    <svg {...svgProps()}>
      <path d="M9 3h6v5l4 9a2 2 0 0 1-1.8 3H6.8A2 2 0 0 1 5 17l4-9z" />
      <path d="M6.5 14h11" />
    </svg>
  ),
  Recetario: () => (
    <svg {...svgProps()}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H19v16H5.5A1.5 1.5 0 0 1 4 18.5z" />
      <path d="M8 4v16M11 9h5M11 13h5" />
    </svg>
  ),
  Precios: () => (
    <svg {...svgProps()}>
      <path d="M6 19 19 6" />
      <circle cx="8" cy="8" r="2.2" />
      <circle cx="17" cy="17" r="2.2" />
    </svg>
  ),
  Proveedores: () => (
    <svg {...svgProps()}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 6.5a3 3 0 0 1 0 6M17.5 20a5.5 5.5 0 0 0-2-4.3" />
    </svg>
  ),
  Reportes: () => (
    <svg {...svgProps()}>
      <path d="M7 8V3.5h10V8" />
      <rect x="4" y="8" width="16" height="7" rx="1.5" />
      <path d="M7 15h10v5.5H7z" />
    </svg>
  ),
  Estadisticas: () => (
    <svg {...svgProps()}>
      <path d="M4 20V4M4 20h16" />
      <path d="M8 16v-4M12 16V8M16 16v-6" />
    </svg>
  ),
  VentasPos: () => (
    <svg {...svgProps()}>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <path d="M9.5 8h5M9.5 12h5" />
    </svg>
  ),
  Feedback: () => (
    <svg {...svgProps()}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-5 4z" />
    </svg>
  ),
  Ajustes: () => (
    <svg {...svgProps()}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M4.2 7.5l2.6 1.5M17.2 15l2.6 1.5M4.2 16.5l2.6-1.5M17.2 9l2.6-1.5" />
    </svg>
  ),
  Search: () => (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      className="w-full h-full"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  ),
};

type NavItem = { href: string; label: string; icon: () => React.ReactElement };

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Operación",
    items: [
      { href: "/", label: "Inicio", icon: Icon.Inicio },
      { href: "/registro", label: "Registro diario", icon: Icon.Registro },
      { href: "/inventario-barra", label: "Inventario de Barra", icon: Icon.Barra },
    ],
  },
  {
    label: "Stock",
    items: [
      { href: "/inventario", label: "Inventario", icon: Icon.Inventario },
      { href: "/stock", label: "Stock semanal", icon: Icon.StockSemanal },
      { href: "/cristaleria", label: "Cristalería y Vajilla", icon: Icon.Cristaleria },
      { href: "/heladeras", label: "Heladeras", icon: Icon.Heladeras },
      { href: "/compras", label: "Compras & Pedidos", icon: Icon.Compras },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { href: "/productos", label: "Productos", icon: Icon.Productos },
      { href: "/costeo", label: "Costeo & Recetas", icon: Icon.Costeo },
      { href: "/recetario", label: "Recetario", icon: Icon.Recetario },
      { href: "/precios", label: "Precios & Rentabilidad", icon: Icon.Precios },
      { href: "/proveedores", label: "Proveedores", icon: Icon.Proveedores },
    ],
  },
  {
    label: "Análisis",
    items: [
      { href: "/reportes", label: "Reportes", icon: Icon.Reportes },
      { href: "/estadisticas", label: "Estadísticas", icon: Icon.Estadisticas },
      { href: "/ventas-pos", label: "Ventas POS", icon: Icon.VentasPos },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/feedback", label: "Feedback", icon: Icon.Feedback },
      { href: "/ajustes", label: "Ajustes", icon: Icon.Ajustes },
    ],
  },
];

const FLAT_NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FLAT_NAV;
    return FLAT_NAV.filter((item) => item.label.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      // Focus after the element mounts.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (selected >= matches.length) setSelected(0);
  }, [matches, selected]);

  function go(item: NavItem) {
    router.push(item.href);
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-24 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-bg-card border border-border rounded-md shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 border-b border-border">
          <span className="text-text-faint">
            <Icon.Search />
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelected((s) => Math.min(s + 1, matches.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelected((s) => Math.max(s - 1, 0));
              }
              if (e.key === "Enter" && matches[selected]) {
                e.preventDefault();
                go(matches[selected]);
              }
            }}
            placeholder="Buscar una sección..."
            className="flex-1 bg-transparent py-3 text-sm text-text placeholder:text-text-faint outline-none"
          />
          <kbd className="text-[0.625rem] font-mono text-text-faint border border-border rounded px-1.5 py-0.5">
            Esc
          </kbd>
        </div>
        <div className="max-h-72 overflow-y-auto py-1">
          {matches.length === 0 ? (
            <p className="px-4 py-6 text-sm text-text-muted text-center">Sin resultados</p>
          ) : (
            matches.map((item, i) => {
              const ItemIcon = item.icon;
              return (
                <button
                  key={item.href}
                  type="button"
                  onMouseEnter={() => setSelected(i)}
                  onClick={() => go(item)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left ${
                    i === selected ? "bg-bg-subtle text-text" : "text-text-muted"
                  }`}
                >
                  <span className="shrink-0"><ItemIcon /></span>
                  {item.label}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export function Sidebar({
  venueName,
  userEmail,
  version,
  changelog,
}: {
  venueName: string;
  userEmail: string;
  version: string;
  changelog: Record<string, { title: string; items: string[] }>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-bg-elevated border-b border-border px-4 py-3">
        <span className="font-serif text-lg text-text">{venueName}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPaletteOpen(true)}
            aria-label="Buscar"
            className="text-text-muted p-2"
          >
            <span className="w-5 h-5 block"><Icon.Search /></span>
          </button>
          <NotificationsBell version={version} changelog={changelog} />
          <button
            onClick={() => setOpen(!open)}
            aria-label="Abrir menú"
            className="text-text text-2xl leading-none px-2"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {open && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-30 w-72 shrink-0 bg-bg-elevated border-r border-border
          flex flex-col transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        `}
      >
        <div className="hidden md:flex items-start justify-between px-5 py-5 border-b border-border">
          <div className="min-w-0">
            <div className="font-serif text-lg text-text truncate">{venueName}</div>
            <div className="text-xs text-text-muted truncate">{userEmail}</div>
          </div>
          <NotificationsBell version={version} changelog={changelog} />
        </div>

        <button
          onClick={() => setPaletteOpen(true)}
          className="hidden md:flex items-center gap-2 mx-4 mt-4 mb-1 px-3 py-2 rounded-md border border-border text-text-faint text-sm hover:border-text-faint hover:text-text-muted"
        >
          <span className="w-3.5 h-3.5 shrink-0"><Icon.Search /></span>
          Buscar
          <kbd className="ml-auto font-mono text-[0.625rem] border border-border rounded px-1.5 py-0.5 shrink-0">
            Ctrl K
          </kbd>
        </button>

        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mt-4 first:mt-2">
              <div className="px-5 pb-1.5 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-text-faint">
                {group.label}
              </div>
              {group.items.map((item) => {
                const active = pathname === item.href;
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-5 py-2.5 text-sm ${
                      active
                        ? "bg-accent-soft text-accent border-r-2 border-accent"
                        : "text-text-muted hover:text-text hover:bg-bg-card"
                    }`}
                  >
                    <span className="shrink-0 opacity-80"><ItemIcon /></span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-border flex items-center justify-between">
          <span className="text-xs text-text-muted md:hidden truncate">{userEmail}</span>
          <SignOutButton />
        </div>
      </aside>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
