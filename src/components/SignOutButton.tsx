"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ redirectTo: "/login" })}
      className="text-xs text-text-muted hover:text-loss underline"
    >
      Cerrar sesión
    </button>
  );
}
