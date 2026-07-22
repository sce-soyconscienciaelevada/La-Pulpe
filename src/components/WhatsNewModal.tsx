"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "barmgmt_seen_version";

export function WhatsNewModal({
  version,
  changelog,
}: {
  version: string;
  changelog?: { title: string; items: string[] };
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!changelog) return;
    const seen = window.localStorage.getItem(STORAGE_KEY);
    if (seen !== version) setShow(true);
  }, [version, changelog]);

  function dismiss() {
    window.localStorage.setItem(STORAGE_KEY, version);
    setShow(false);
  }

  if (!show || !changelog) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-bg-card border border-border rounded-xl p-6 max-w-sm w-full">
        <h2 className="font-semibold text-text text-lg mb-1">✨ Novedades</h2>
        <p className="text-sm text-text-muted mb-3">{changelog.title}</p>
        <ul className="text-sm text-text list-disc list-inside space-y-1 mb-5">
          {changelog.items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
        <button
          onClick={dismiss}
          className="w-full rounded-lg bg-accent text-bg font-semibold py-2.5 text-sm"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
