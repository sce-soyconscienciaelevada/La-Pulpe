import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Every Server Action that mutates data must call this first — Server Actions
// are reachable by direct POST, not just by clicking the button in the UI
// (same lesson from Dolipa Store's admin build).
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}
