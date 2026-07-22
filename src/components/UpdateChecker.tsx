"use client";

import { useEffect, useState } from "react";

// Polls /api/version, which always reflects whatever's actually deployed
// right now. If it ever differs from the version this page was loaded with,
// a new deploy has gone live -- show a banner with a reload button.
export function UpdateChecker({ initialVersion }: { initialVersion: string }) {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        const data = await res.json();
        if (data.version && data.version !== initialVersion) {
          setUpdateAvailable(true);
        }
      } catch {
        // network hiccup -- try again next tick, not worth surfacing
      }
    };
    const interval = setInterval(check, 30000);
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [initialVersion]);

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-bg-card border border-accent rounded-xl shadow-lg p-4 max-w-xs">
      <p className="font-semibold text-text mb-1">🔄 Actualización disponible</p>
      <p className="text-sm text-text-muted mb-3">Hay una versión nueva del sistema lista.</p>
      <button
        onClick={() => window.location.reload()}
        className="w-full rounded-lg bg-accent text-bg font-semibold py-2 text-sm"
      >
        Actualizar ahora
      </button>
    </div>
  );
}
