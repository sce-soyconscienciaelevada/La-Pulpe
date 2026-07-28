"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export async function recordTempEntry(unitId: string, date: string, tempC: number | null) {
  await requireAdmin();
  await prisma.fridgeTempEntry.upsert({
    where: { unitId_date: { unitId, date: new Date(date) } },
    update: { tempC },
    create: { unitId, date: new Date(date), tempC },
  });
  revalidatePath("/heladeras");
}

export async function addFridgeIncident(input: {
  unitId: string;
  date: string;
  tempRecorded: number | null;
  actionTaken: string;
  responsiblePersonId: string | null;
}) {
  await requireAdmin();
  if (!input.actionTaken.trim()) return;
  await prisma.fridgeIncident.create({
    data: {
      unitId: input.unitId,
      date: new Date(input.date),
      tempRecorded: input.tempRecorded,
      actionTaken: input.actionTaken.trim(),
      responsiblePersonId: input.responsiblePersonId || null,
    },
  });
  revalidatePath("/heladeras");
}

export async function deleteFridgeIncident(id: string) {
  await requireAdmin();
  await prisma.fridgeIncident.delete({ where: { id } });
  revalidatePath("/heladeras");
}
