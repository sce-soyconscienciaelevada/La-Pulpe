"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SignOutButton } from "./SignOutButton";
import { NotificationsBell } from "./NotificationsBell";

const NAV = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/inventario", label: "Inventario", icon: "📦" },
  { href: "/inventario-barra", label: "Inventario de Barra", icon: "🥃" },
  { href: "/registro", label: "Registro diario", icon: "🍸" },
  { href: "/stock", label: "Stock semanal", icon: "📋" },
  { href: "/cristaleria", label: "Cristalería y Vajilla", icon: "🥂" },
  { href: "/heladeras", label: "Heladeras", icon: "🧊" },
  { href: "/compras", label: "Compras & Pedidos", icon: "🚚" },
  { href: "/productos", label: "Productos", icon: "🏷️" },
  { href: "/costeo", label: "Costeo & Recetas", icon: "🧪" },
  { href: "/recetario", label: "Recetario", icon: "📖" },
  { href: "/precios", label: "Precios & Rentabilidad", icon: "💰" },
  { href: "/proveedores", label: "Proveedores", icon: "🤝" },
  { href: "/reportes", label: "Reportes", icon: "🖨️" },
  { href: "/estadisticas", label: "Estadísticas", icon: "📈" },
  { href: "/ventas-pos", label: "Ventas POS", icon: "🧾" },
  { href: "/feedback", label: "Feedback", icon: "💬" },
  { href: "/ajustes", label: "Ajustes", icon: "⚙️" },
];

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

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-bg-elevated border-b border-border px-4 py-3">
        <span className="font-semibold text-text">{venueName}</span>
        <div className="flex items-center gap-1">
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
          <div>
            <div className="font-semibold text-text text-lg">{venueName}</div>
            <div className="text-xs text-text-muted">{userEmail}</div>
          </div>
          <NotificationsBell version={version} changelog={changelog} />
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-5 py-3 text-sm ${
                  active
                    ? "bg-accent-soft text-accent border-r-2 border-accent"
                    : "text-text-muted hover:text-text hover:bg-bg-card"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border flex items-center justify-between">
          <span className="text-xs text-text-muted md:hidden">{userEmail}</span>
          <SignOutButton />
        </div>
      </aside>
    </>
  );
}
