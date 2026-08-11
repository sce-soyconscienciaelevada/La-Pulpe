"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function demoGateAction(formData: FormData) {
  const expected = process.env["DEMO_GATE_PASSWORD"];
  const provided = formData.get("password");
  const next = (formData.get("next") as string) || "/";

  if (!expected || provided !== expected) {
    return { error: "Contraseña incorrecta." };
  }

  const jar = await cookies();
  jar.set("demo_gate", expected, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  redirect(next);
}
