"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export async function createPeriodAction(input: { venueId: string; label: string; startAt: string; endAt: string }) {
  await requireAdmin();
  const existing = await prisma.posSalesPeriod.findFirst({ where: { venueId: input.venueId, status: "OPEN" } });
  if (existing) return { error: "Ya hay un período abierto. Cerralo antes de crear uno nuevo." };
  if (!input.label.trim()) return { error: "Falta el nombre del período." };

  await prisma.posSalesPeriod.create({
    data: {
      venueId: input.venueId,
      label: input.label.trim(),
      startAt: new Date(input.startAt),
      endAt: new Date(input.endAt),
    },
  });
  revalidatePath("/ventas-pos");
  return { success: true };
}

// Peek only — used by the posCode on-blur lookup to suggest descripción/producto
// from the most recent line that used this code, across any period.
export async function lookupKnownCode(posCode: string) {
  await requireAdmin();
  if (!posCode.trim()) return null;
  const line = await prisma.posSalesLine.findFirst({
    where: { posCode: posCode.trim() },
    orderBy: { createdAt: "desc" },
    include: { product: true },
  });
  if (!line) return null;
  return { descripcion: line.descripcion, productId: line.productId, productName: line.product?.name ?? null };
}

export async function addLineAction(input: {
  periodId: string;
  categoryName: string;
  posCode: string;
  descripcion: string;
  unidadesVendidas: number;
  productId: string | null;
  forceRelink?: boolean;
}) {
  await requireAdmin();
  if (!input.categoryName.trim() || !input.posCode.trim() || !input.descripcion.trim()) {
    return { error: "Faltan datos: categoría, código y descripción son obligatorios." };
  }

  // Soft duplicate check within the same period, any category.
  const duplicate = await prisma.posSalesLine.findFirst({
    where: { posCode: input.posCode.trim(), category: { periodId: input.periodId } },
  });
  if (duplicate && !input.forceRelink) {
    return {
      warning: `Este código ya fue cargado en este período: "${duplicate.descripcion}". ¿Fila duplicada? Confirmá para cargarla igual.`,
    };
  }

  // Product mapping backfill — never silently overwrite a different existing code.
  if (input.productId) {
    const product = await prisma.product.findUnique({ where: { id: input.productId } });
    if (product && !product.posCode) {
      await prisma.product.update({ where: { id: input.productId }, data: { posCode: input.posCode.trim() } });
    } else if (product && product.posCode && product.posCode !== input.posCode.trim() && !input.forceRelink) {
      return {
        warning: `"${product.name}" ya está vinculado al código "${product.posCode}". ¿Confirmás vincularlo también a "${input.posCode.trim()}"?`,
      };
    }
  }

  const category = await prisma.posSalesCategory.upsert({
    where: { periodId_name: { periodId: input.periodId, name: input.categoryName } },
    update: {},
    create: { periodId: input.periodId, name: input.categoryName },
  });

  await prisma.posSalesLine.create({
    data: {
      categoryId: category.id,
      posCode: input.posCode.trim(),
      descripcion: input.descripcion.trim(),
      unidadesVendidas: input.unidadesVendidas,
      productId: input.productId,
    },
  });

  revalidatePath("/ventas-pos");
  return { success: true };
}

export async function deleteLineAction(lineId: string) {
  await requireAdmin();
  await prisma.posSalesLine.delete({ where: { id: lineId } });
  revalidatePath("/ventas-pos");
}

export async function updateCategoryTicketTotal(categoryId: string, totalTicket: number | null) {
  await requireAdmin();
  await prisma.posSalesCategory.update({ where: { id: categoryId }, data: { totalTicket } });
  revalidatePath("/ventas-pos");
}

export async function updatePeriodTotalUnidades(periodId: string, totalUnidades: number | null) {
  await requireAdmin();
  await prisma.posSalesPeriod.update({ where: { id: periodId }, data: { totalUnidades } });
  revalidatePath("/ventas-pos");
}

export async function closePeriodAction(periodId: string) {
  await requireAdmin();
  await prisma.posSalesPeriod.update({ where: { id: periodId }, data: { status: "CLOSED", closedAt: new Date() } });
  revalidatePath("/ventas-pos");
}
