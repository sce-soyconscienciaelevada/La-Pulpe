"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export async function updateVenue(formData: FormData) {
  await requireAdmin();
  const venue = await prisma.venue.findFirstOrThrow();
  await prisma.venue.update({
    where: { id: venue.id },
    data: {
      name: String(formData.get("name")),
      currency: String(formData.get("currency")),
    },
  });
  revalidatePath("/ajustes");
  revalidatePath("/");
}

export async function changePassword(formData: FormData) {
  const user = await requireAdmin();
  const newPassword = String(formData.get("newPassword") || "");
  if (newPassword.length < 6) return { error: "Mínimo 6 caracteres." };
  if (!user.email) return { error: "Sesión inválida." };
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { email: user.email }, data: { passwordHash } });
  return { success: true };
}
