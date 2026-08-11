export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireServiceKey } from "@/lib/auth/service-key";
import { seedDemo } from "@/lib/demo/seedDemo";

// Nightly reset for the demo deploy — n8n hits this on a schedule with
// X-Api-Key: BARMGMT_SERVICE_KEY. Double guard: the service key AND
// BARMGMT_DEMO=true (checked again inside seedDemo) both have to be true, so
// this route is inert on the real La Pulpe deploy even if the key ever
// leaked there.
export async function POST(request: Request) {
  const unauthorized = requireServiceKey(request);
  if (unauthorized) return unauthorized;

  if (process.env["BARMGMT_DEMO"] !== "true") {
    return NextResponse.json({ error: "not a demo deploy" }, { status: 403 });
  }

  const result = await seedDemo();
  return NextResponse.json({ ok: true, venueId: result.venueId });
}
