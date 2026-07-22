"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export async function updateFichaTecnica(
  productId: string,
  input: {
    photoUrl: string;
    description: string;
    preparationSteps: string;
    garnish: string;
    glassLabel: string;
  }
) {
  await requireAdmin();
  await prisma.recipe.update({
    where: { productId },
    data: {
      photoUrl: input.photoUrl.trim() || null,
      description: input.description.trim() || null,
      preparationSteps: input.preparationSteps.trim() || null,
      garnish: input.garnish.trim() || null,
      glassLabel: input.glassLabel.trim() || null,
    },
  });
  revalidatePath("/recetario");
  revalidatePath(`/recetario/${productId}`);
}
