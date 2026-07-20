"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export async function createSupplier(formData: FormData) {
  await requireAdmin();
  const venue = await prisma.venue.findFirstOrThrow();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await prisma.supplier.create({
    data: {
      venueId: venue.id,
      name,
      contactPhone: (formData.get("contactPhone") as string) || null,
      contactNote: (formData.get("contactNote") as string) || null,
    },
  });
  revalidatePath("/proveedores");
}

export async function deleteSupplier(id: string) {
  await requireAdmin();
  await prisma.supplier.delete({ where: { id } });
  revalidatePath("/proveedores");
}
