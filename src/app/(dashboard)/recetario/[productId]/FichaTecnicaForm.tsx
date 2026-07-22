"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateFichaTecnica } from "../actions";
import { Card } from "@/components/ui";

type Initial = {
  photoUrl: string;
  description: string;
  preparationSteps: string;
  garnish: string;
  glassLabel: string;
};

export function FichaTecnicaForm({ productId, initial }: { productId: string; initial: Initial }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [photoUrl, setPhotoUrl] = useState(initial.photoUrl);
  const [description, setDescription] = useState(initial.description);
  const [preparationSteps, setPreparationSteps] = useState(initial.preparationSteps);
  const [garnish, setGarnish] = useState(initial.garnish);
  const [glassLabel, setGlassLabel] = useState(initial.glassLabel);
  const [saved, setSaved] = useState(false);

  return (
    <Card>
      <div className="aspect-video rounded-lg bg-bg-elevated mb-4 flex items-center justify-center overflow-hidden">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm text-text-muted">Sin foto todavía</span>
        )}
      </div>

      <label className="block text-sm text-text-muted mb-4">
        URL de la foto
        <input
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          placeholder="https://..."
          className="mt-1 w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text"
        />
      </label>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <label className="block text-sm text-text-muted">
          Vaso / copa
          <input
            value={glassLabel}
            onChange={(e) => setGlassLabel(e.target.value)}
            placeholder="Ej: Copa Martini"
            className="mt-1 w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text"
          />
        </label>
        <label className="block text-sm text-text-muted">
          Guarnición
          <input
            value={garnish}
            onChange={(e) => setGarnish(e.target.value)}
            placeholder="Ej: Twist de naranja"
            className="mt-1 w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text"
          />
        </label>
      </div>

      <label className="block text-sm text-text-muted mb-4">
        Descripción
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Historia, sabor, para quién es..."
          className="mt-1 w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text resize-none"
        />
      </label>

      <label className="block text-sm text-text-muted mb-4">
        Preparación (un paso por línea)
        <textarea
          value={preparationSteps}
          onChange={(e) => setPreparationSteps(e.target.value)}
          rows={5}
          placeholder={"Enfriar la copa\nAgitar los ingredientes con hielo\nColar y servir\nDecorar"}
          className="mt-1 w-full rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text resize-none"
        />
      </label>

      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await updateFichaTecnica(productId, { photoUrl, description, preparationSteps, garnish, glassLabel });
            setSaved(true);
            router.refresh();
            setTimeout(() => setSaved(false), 2000);
          })
        }
        className="w-full rounded-lg bg-accent text-bg font-semibold py-2.5 text-sm disabled:opacity-50"
      >
        {saved ? "Guardado ✓" : "Guardar"}
      </button>
    </Card>
  );
}
