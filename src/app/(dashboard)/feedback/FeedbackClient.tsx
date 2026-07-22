"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { createFeedback, updateFeedbackStatus } from "./actions";
import { Card, Badge } from "@/components/ui";

type Item = {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  submittedBy: string | null;
  createdAt: string;
  screenshotDataUrl: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  BUG: "🐞 Bug",
  FEATURE_REQUEST: "✨ Nueva función",
  WORKAROUND: "🔧 Workaround",
  QUESTION: "❓ Pregunta",
  OTHER: "📝 Otro",
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "Nuevo",
  IN_PROGRESS: "En progreso",
  DONE: "Resuelto",
  WONT_FIX: "No se va a hacer",
};

const STATUS_TONE: Record<string, "default" | "loss" | "profit" | "comp" | "accent"> = {
  NEW: "loss",
  IN_PROGRESS: "comp",
  DONE: "profit",
  WONT_FIX: "default",
};

// Downscale + JPEG-compress a pasted image so a full-resolution screenshot
// doesn't turn into a multi-megabyte DB row -- there's no Blob storage wired
// yet, this goes straight into Postgres as a data: URI.
function compressImage(blob: Blob, maxWidth = 1000, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = document.createElement("img");
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas context"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function FeedbackClient({ items }: { items: Item[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<string>("ALL");
  const [type, setType] = useState<string>("BUG");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const pasteAreaRef = useRef<HTMLTextAreaElement>(null);

  async function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    if (!item) return; // let normal text paste through
    e.preventDefault();
    const blob = item.getAsFile();
    if (!blob) return;
    const compressed = await compressImage(blob);
    setScreenshot(compressed);
  }

  return (
    <div className="space-y-5">
      <Card>
        <h2 className="font-semibold text-text mb-3">Reportar algo</h2>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text"
          >
            {Object.entries(TYPE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título breve"
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text"
          />
        </div>
        <textarea
          ref={pasteAreaRef}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onPaste={handlePaste}
          placeholder="Contá qué pasó, qué esperabas, o qué te gustaría que hiciera... (podés pegar una captura con Ctrl+V)"
          rows={3}
          className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text mb-3 resize-none"
        />

        {screenshot && (
          <div className="relative inline-block mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={screenshot} alt="Captura pegada" className="max-h-40 rounded-lg border border-border" />
            <button
              onClick={() => setScreenshot(null)}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-loss text-white text-xs font-bold"
              aria-label="Quitar captura"
            >
              ✕
            </button>
          </div>
        )}
        {!screenshot && (
          <p className="text-xs text-text-muted mb-3">
            💡 Tip: copiá una captura de pantalla y pegala (Ctrl+V) arriba para mostrar qué pasó.
          </p>
        )}

        <button
          disabled={isPending || !title.trim() || !description.trim()}
          onClick={() =>
            startTransition(async () => {
              await createFeedback({
                type: type as never,
                title,
                description,
                screenshotDataUrl: screenshot ?? undefined,
              });
              setTitle("");
              setDescription("");
              setScreenshot(null);
              router.refresh();
            })
          }
          className="w-full rounded-lg bg-accent text-bg font-semibold py-2.5 text-sm disabled:opacity-50"
        >
          Enviar
        </button>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => setFilter(filter === "NEW" ? "ALL" : "NEW")}>
          <Card className={`text-center ${filter === "NEW" ? "border-accent" : ""}`}>
            <div className="text-xs text-text-muted mb-1">NUEVOS</div>
            <div className="text-2xl font-bold text-loss">{counts(items).NEW}</div>
          </Card>
        </button>
        <button onClick={() => setFilter(filter === "IN_PROGRESS" ? "ALL" : "IN_PROGRESS")}>
          <Card className={`text-center ${filter === "IN_PROGRESS" ? "border-accent" : ""}`}>
            <div className="text-xs text-text-muted mb-1">EN PROGRESO</div>
            <div className="text-2xl font-bold text-comp">{counts(items).IN_PROGRESS}</div>
          </Card>
        </button>
        <button onClick={() => setFilter(filter === "DONE" ? "ALL" : "DONE")}>
          <Card className={`text-center ${filter === "DONE" ? "border-accent" : ""}`}>
            <div className="text-xs text-text-muted mb-1">RESUELTOS</div>
            <div className="text-2xl font-bold text-profit">{counts(items).DONE}</div>
          </Card>
        </button>
      </div>

      <div className="space-y-3">
        {(filter === "ALL" ? items : items.filter((i) => i.status === filter)).length === 0 && (
          <p className="text-sm text-text-muted">Sin reportes{filter !== "ALL" ? " en este estado" : ""}.</p>
        )}
        {(filter === "ALL" ? items : items.filter((i) => i.status === filter)).map((item) => (
          <Card key={item.id}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="text-sm text-text-muted">{TYPE_LABELS[item.type] ?? item.type}</div>
                <h3 className="font-medium text-text">{item.title}</h3>
              </div>
              <Badge tone={STATUS_TONE[item.status]}>{STATUS_LABELS[item.status]}</Badge>
            </div>
            <p className="text-sm text-text-muted whitespace-pre-wrap mb-3">{item.description}</p>

            {item.screenshotDataUrl && (
              <div className="mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.screenshotDataUrl}
                  alt="Captura adjunta"
                  onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                  className={`rounded-lg border border-border cursor-pointer transition-all ${
                    expanded === item.id ? "max-w-full" : "max-h-32"
                  }`}
                />
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>{new Date(item.createdAt).toLocaleDateString("es-AR")}</span>
              <select
                value={item.status}
                disabled={isPending}
                onChange={(e) =>
                  startTransition(async () => {
                    await updateFeedbackStatus(item.id, e.target.value as never);
                    router.refresh();
                  })
                }
                className="rounded-lg border border-border bg-bg-elevated px-2 py-1 text-xs text-text"
              >
                {Object.entries(STATUS_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function counts(items: Item[]) {
  return {
    NEW: items.filter((i) => i.status === "NEW").length,
    IN_PROGRESS: items.filter((i) => i.status === "IN_PROGRESS").length,
    DONE: items.filter((i) => i.status === "DONE").length,
  };
}
