import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { FeedbackClient } from "./FeedbackClient";

export default async function FeedbackPage() {
  const venue = await prisma.venue.findFirstOrThrow();
  const items = await prisma.feedbackItem.findMany({
    where: { venueId: venue.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Feedback"
        subtitle="Reportá bugs, pedí funciones nuevas, o contá qué no funciona"
      />
      <FeedbackClient
        items={items.map((i) => ({
          id: i.id,
          type: i.type,
          title: i.title,
          description: i.description,
          status: i.status,
          submittedBy: i.submittedBy,
          createdAt: i.createdAt.toISOString(),
          screenshotDataUrl: i.screenshotDataUrl,
        }))}
      />
    </div>
  );
}
