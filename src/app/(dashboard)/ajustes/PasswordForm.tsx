"use client";

import { useState, useTransition } from "react";
import { changePassword } from "./actions";

export function PasswordForm() {
  const [msg, setMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        setMsg(null);
        startTransition(async () => {
          const res = await changePassword(formData);
          if (res?.error) setMsg({ type: "error", text: res.error });
          else setMsg({ type: "success", text: "Contraseña actualizada." });
        });
      }}
      className="flex flex-col sm:flex-row gap-2"
    >
      <input
        name="newPassword"
        type="password"
        placeholder="Nueva contraseña"
        required
        className="flex-1 rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-accent text-bg font-semibold px-4 py-2.5 text-sm shrink-0"
      >
        Cambiar
      </button>
      {msg && (
        <span className={`text-sm self-center ${msg.type === "error" ? "text-loss" : "text-profit"}`}>
          {msg.text}
        </span>
      )}
    </form>
  );
}
