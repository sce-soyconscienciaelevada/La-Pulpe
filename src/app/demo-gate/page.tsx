import DemoGateForm from "./DemoGateForm";

export default async function DemoGatePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-4">
      <DemoGateForm next={params.next || "/"} />
    </main>
  );
}
