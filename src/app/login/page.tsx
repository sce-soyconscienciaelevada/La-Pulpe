"use client";

import { useState, useTransition } from "react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-4">
      <form
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            const res = await loginAction(formData);
            if (res?.error) setError(res.error);
          });
        }}
        className="w-full max-w-sm bg-bg-card border border-border rounded-xl p-6 sm:p-8"
      >
        <h1 className="text-xl font-semibold text-text mb-1">Bar Management</h1>
        <p className="text-sm text-text-muted mb-6">Iniciá sesión para continuar</p>

        <label className="block text-sm text-text-muted mb-1" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full mb-4 rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-base text-text outline-none focus:border-accent"
        />

        <label className="block text-sm text-text-muted mb-1" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full mb-4 rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-base text-text outline-none focus:border-accent"
        />

        {error && <p className="text-sm text-loss mb-4">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-accent text-bg font-semibold py-2.5 disabled:opacity-60"
        >
          {isPending ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
