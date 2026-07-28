"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "barmgmt_seen_version";

type ChangelogMap = Record<string, { title: string; items: string[] }>;

export function NotificationsBell({ version, changelog }: { version: string; changelog: ChangelogMap }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    const seen = window.localStorage.getItem(STORAGE_KEY);
    setUnread(seen !== version);
  }, [version]);

  function handleOpen() {
    setOpen(true);
    window.localStorage.setItem(STORAGE_KEY, version);
    setUnread(false);
  }

  const versions = Object.keys(changelog).sort((a, b) => (a < b ? 1 : -1));

  return (
    <>
      <button
        onClick={handleOpen}
        aria-label="Novedades"
        className="relative text-xl leading-none px-1.5 py-1 text-text-muted hover:text-text"
      >
        🔔
        {unread && (
          <span className="absolute top-0 right-0.5 h-2.5 w-2.5 rounded-full bg-loss border border-bg-elevated" />
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-bg-card border border-border rounded-xl p-5 max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-text text-lg">🔔 Novedades del sistema</h2>
              <button onClick={() => setOpen(false)} className="text-text-muted text-xl leading-none px-1">
                ✕
              </button>
            </div>
            <div className="space-y-5">
              {versions.map((v) => (
                <div key={v}>
                  <div className="text-xs text-text-muted mb-1">{v}</div>
                  <p className="font-medium text-text mb-1">{changelog[v].title}</p>
                  <ul className="text-sm text-text-muted list-disc list-inside space-y-0.5">
                    {changelog[v].items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
