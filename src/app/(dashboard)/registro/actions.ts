"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { properName } from "@/lib/text-normalize";
import { recordConsumption } from "@/lib/stock/movements";
import { getOrCreateBusinessDay, closeBusinessDay, clearBusinessDay } from "@/lib/register/day";
import type { ConsumptionType } from "@/generated/prisma/enums";

async function currentVenueAndDay() {
  const venue = await prisma.venue.findFirstOrThrow();
  const day = await getOrCreateBusinessDay(venue.id);
  return { venue, day };
}

export async function tapConsumption(productId: string, type: ConsumptionType, personId?: string) {
  await requireAdmin();
  const { venue, day } = await currentVenueAndDay();
  await recordConsumption({
    venueId: venue.id,
    businessDayId: day.id,
    productId,
    type,
    quantity: 1,
    personId,
  });
  revalidatePath("/registro");
  revalidatePath("/");
}

export async function addFreeTextConsumption(
  freeText: string,
  quantity: number,
  type: ConsumptionType,
  personId?: string
) {
  await requireAdmin();
  if (!freeText.trim()) return;
  const { venue, day } = await currentVenueAndDay();
  await recordConsumption({
    venueId: venue.id,
    businessDayId: day.id,
    freeText: properName(freeText),
    type,
    quantity,
    personId,
  });
  revalidatePath("/registro");
  revalidatePath("/");
}

export async function addOwner(name: string) {
  await requireAdmin();
  if (!name.trim()) return;
  const venue = await prisma.venue.findFirstOrThrow();
  await prisma.person.create({ data: { venueId: venue.id, name: properName(name), kind: "OWNER" } });
  revalidatePath("/registro");
}

export async function addReorderItem(name: string, quantity: number, supplierId?: string, supplierLabel?: string) {
  await requireAdmin();
  if (!name.trim()) return;
  const { venue, day } = await currentVenueAndDay();
  await prisma.reorderItem.create({
    data: {
      venueId: venue.id,
      businessDayId: day.id,
      name: properName(name),
      quantity,
      supplierId,
      supplierLabel,
    },
  });
  revalidatePath("/registro");
}

export async function closeDayAction() {
  await requireAdmin();
  const { day } = await currentVenueAndDay();
  await closeBusinessDay(day.id);
  revalidatePath("/registro");
  revalidatePath("/reportes");
}

export async function clearDayAction() {
  await requireAdmin();
  const { day } = await currentVenueAndDay();
  await clearBusinessDay(day.id);
  revalidatePath("/registro");
  revalidatePath("/inventario");
  revalidatePath("/");
}
