import { NextResponse, type NextRequest } from "next/server";

// Extra passphrase wall in front of the demo deploy — on top of the app's
// normal login, so a leaked demo link doesn't even show the login screen or
// brand without the shared passphrase. Auto-disabled (no-op passthrough) on
// any deploy that doesn't set DEMO_GATE_PASSWORD — this must never affect
// the real La Pulpe production deploy (which stays on Vercel, no Dockerfile
// build, so this middleware only ever runs on the demo EasyPanel build).
const COOKIE_NAME = "demo_gate";

export function middleware(request: NextRequest) {
  const gatePassword = process.env["DEMO_GATE_PASSWORD"];
  if (!gatePassword) return NextResponse.next();

  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (cookie === gatePassword) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/demo-gate";
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|demo-gate).*)"],
};
