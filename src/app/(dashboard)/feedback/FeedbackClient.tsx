"use client";

import { useState, useTransition } from "react";
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

export function FeedbackClient({ items }: { items: Item[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<string>("ALL");
  const [type, setType] = useState<string>("BUG");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const filtered = filter === "ALL" ? items : items.filter((i) => i.status === filter);
  const counts = {
    NEW: items.filter((i) => i.status === "NEW").length,
    IN_PROGRESS: items.filter((i) => i.status === "IN_PROGRESS").length,
    DONE: items.filter((i) => i.status === "DONE").length,
  };

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
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Contá qué pasó, qué esperabas, o qué te gustaría que hiciera..."
          rows={3}
          className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text mb-3 resize-none"
        />
        <button
          disabled={isPending || !title.trim() || !description.trim()}
          onClick={() =>
            startTransition(async () => {
              await createFeedback({ type: type as never, title, description });
              setTitle("");
              setDescription("");
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
            <div className="text-2xl font-bold text-loss">{counts.NEW}</div>
          </Card>
        </button>
        <button onClick={() => setFilter(filter === "IN_PROGRESS" ? "ALL" : "IN_PROGRESS")}>
          <Card className={`text-center ${filter === "IN_PROGRESS" ? "border-accent" : ""}`}>
            <div className="text-xs text-text-muted mb-1">EN PROGRESO</div>
            <div className="text-2xl font-bold text-comp">{counts.IN_PROGRESS}</div>
          </Card>
        </button>
        <button onClick={() => setFilter(filter === "DONE" ? "ALL" : "DONE")}>
          <Card className={`text-center ${filter === "DONE" ? "border-accent" : ""}`}>
            <div className="text-xs text-text-muted mb-1">RESUELTOS</div>
            <div className="text-2xl font-bold text-profit">{counts.DONE}</div>
          </Card>
        </button>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-sm text-text-muted">Sin reportes{filter !== "ALL" ? " en este estado" : ""}.</p>
        )}
        {filtered.map((item) => (
          <Card key={item.id}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="text-sm text-text-muted">{TYPE_LABELS[item.type] ?? item.type}</div>
                <h3 className="font-medium text-text">{item.title}</h3>
              </div>
              <Badge tone={STATUS_TONE[item.status]}>{STATUS_LABELS[item.status]}</Badge>
            </div>
            <p className="text-sm text-text-muted whitespace-pre-wrap mb-3">{item.description}</p>
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
