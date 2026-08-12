import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/Sidebar";
import { UpdateChecker } from "@/components/UpdateChecker";
import { WhatsNewModal } from "@/components/WhatsNewModal";
import { APP_VERSION, CHANGELOG } from "@/lib/version";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const venue = await prisma.venue.findFirst();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg">
      <Sidebar
        venueName={venue?.name ?? "Bar"}
        userEmail={user.email ?? ""}
        version={APP_VERSION}
        changelog={CHANGELOG}
      />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="max-w-6xl mx-auto p-4 sm:p-6">{children}</div>
      </main>
      <UpdateChecker initialVersion={APP_VERSION} />
      <WhatsNewModal version={APP_VERSION} changelog={CHANGELOG[APP_VERSION]} />
    </div>
  );
}
