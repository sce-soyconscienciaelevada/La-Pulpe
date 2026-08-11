import { NextResponse } from "next/server";

// Same pattern as Micelo's lib/auth/service-key.ts — external callers (n8n's
// nightly reseed cron) hit POST /api/demo/reseed with an API-key header
// instead of a session cookie. Returns a 401 response to short-circuit the
// caller if the key is missing/wrong, or null if the request is authorized.
export function requireServiceKey(request: Request): NextResponse | null {
  const expected = process.env["BARMGMT_SERVICE_KEY"];
  const provided = request.headers.get("x-api-key");
  if (!expected || !provided || provided !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
