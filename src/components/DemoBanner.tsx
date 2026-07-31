"use client";

import { useState, useTransition } from "react";
import { empezarDatosReales } from "@/app/(dashboard)/actions";

// Two-step on purpose: stamping "day one" is not something Pablo should be
// able to do by brushing a button while carrying a tray.
export function DemoBanner() {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="mb-4 rounded-md border border-comp/40 bg-comp/10 p-4">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="text-lg leading-none mt-0.5">
          👀
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-base text-text">Estos son números de ejemplo</h2>
          <p className="text-sm text-text-muted mt-1 max-w-prose">
            Todavía no cargaste información real, así que abajo te mostramos datos inventados para
            que veas cómo se va a ver el panel cuando lo empieces a usar. Nada de esto es tuyo.
          </p>

          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="mt-3 inline-block rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg"
            >
              Empezar a cargar mis datos reales
            </button>
          ) : (
            <div className="mt-3">
              <p className="text-sm text-text max-w-prose">
                Voy a guardar la fecha de hoy como tu primer día. Desde acá en adelante todo lo que
                veas van a ser tus números reales, y los datos de ejemplo desaparecen. ¿Arrancamos?
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => startTransition(() => empezarDatosReales())}
                  className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg disabled:opacity-60"
                >
                  {pending ? "Guardando..." : "Sí, empezar hoy"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setConfirming(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm text-text-muted disabled:opacity-60"
                >
                  Todavía no
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
