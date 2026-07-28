// Best-effort outbound notification — used so Joan gets pinged when Pablo
// submits feedback. Never throws: a notification failure must never block
// the user-facing save (the DB row is the source of truth regardless).
export async function notifyFeedback(payload: {
  type: string;
  title: string;
  description: string;
  venueName: string;
  screenshotDataUrl?: string;
}) {
  const url = process.env["BARMGMT_NOTIFY_HOOK"];
  if (!url) return; // not configured yet — silent no-op, see feedback module docs

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // screenshot payload can be larger than text-only
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, source: "bar-management-feedback", sentAt: new Date().toISOString() }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch {
    // Swallow — notification is best-effort only.
  }
}
