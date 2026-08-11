"use client";

import { useState, useTransition } from "react";
import { demoGateAction } from "./actions";

export default function DemoGateForm({ next }: { next: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const res = await demoGateAction(formData);
          if (res?.error) setError(res.error);
        });
      }}
      className="w-full max-w-sm bg-bg-card border border-border rounded-xl p-6 sm:p-8"
    >
      <input type="hidden" name="next" value={next} />
      <h1 className="text-xl font-semibold text-text mb-1">Demo</h1>
      <p className="text-sm text-text-muted mb-6">Este es un demo con datos ficticios. Ingresá la contraseña que te compartieron.</p>

      <label className="block text-sm text-text-muted mb-1" htmlFor="password">
        Contraseña
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoFocus
        className="w-full mb-4 rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-base text-text outline-none focus:border-accent"
      />

      {error && <p className="text-sm text-loss mb-4">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-accent text-bg font-semibold py-2.5 disabled:opacity-60"
      >
        {isPending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
