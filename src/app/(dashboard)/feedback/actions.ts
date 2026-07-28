"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { notifyFeedback } from "@/lib/notify";
import type { FeedbackType, FeedbackStatus } from "@/generated/prisma/enums";

export async function createFeedback(input: {
  type: FeedbackType;
  title: string;
  description: string;
  screenshotDataUrl?: string;
}) {
  const user = await requireAdmin();
  if (!input.title.trim() || !input.description.trim()) return;

  const venue = await prisma.venue.findFirstOrThrow();
  await prisma.feedbackItem.create({
    data: {
      venueId: venue.id,
      type: input.type,
      title: input.title.trim(),
      description: input.description.trim(),
      submittedBy: user.email ?? null,
      screenshotDataUrl: input.screenshotDataUrl || null,
    },
  });

  // Best-effort — never blocks the save above.
  await notifyFeedback({
    type: input.type,
    title: input.title.trim(),
    description: input.description.trim(),
    venueName: venue.name,
    screenshotDataUrl: input.screenshotDataUrl || undefined,
  });

  revalidatePath("/feedback");
}

export async function updateFeedbackStatus(id: string, status: FeedbackStatus) {
  await requireAdmin();
  await prisma.feedbackItem.update({
    where: { id },
    data: { status, resolvedAt: status === "DONE" ? new Date() : null },
  });
  revalidatePath("/feedback");
}
