"use client";

import { useState } from "react";
import { Card } from "@/components/ui";

const COLUMNS: { label: string; explanation: string }[] = [
  { label: "Exist.", explanation: "Existencia con la que arrancó el día (piezas cerradas, más la botella abierta si había una en uso). Se corrige a mano si el conteo real no coincide." },
  { label: "Ent.", explanation: "Entradas: botellas que subieron de bodega a la barra durante el turno." },
  { label: "Venta x Punto", explanation: "Total consumido en el día, en décimos de botella (1 punto = 1 medida de 2oz). Se carga a mano según lo que se fue marcando en la botella abierta." },
  { label: "Vent. Final Teórico", explanation: "Lo que debería quedar según lo registrado: Exist. + Ent. − Venta x Punto." },
  { label: "Referencia Registro", explanation: "Lo que el Registro diario (la grilla de ventas) ya contabilizó automáticamente para ese producto. Se muestra solo como comparación, no reemplaza la carga manual." },
  { label: "Contado físico", explanation: "Lo que se cuenta a mano al cerrar el turno: la medición real de la botella." },
  { label: "Diferencia", explanation: "Contado físico menos Final Teórico. Si coincide, está correcto. Si es menor, hay merma o venta no registrada. Si es mayor, hay un error de carga." },
];

export function ColumnGlossary() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-accent underline"
      >
        {open ? "Ocultar" : "❓ ¿Qué significa cada columna?"}
      </button>
      {open && (
        <Card className="mt-2">
          <dl className="space-y-2">
            {COLUMNS.map((c) => (
              <div key={c.label}>
                <dt className="text-sm font-medium text-text">{c.label}</dt>
                <dd className="text-xs text-text-muted">{c.explanation}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}
    </div>
  );
}
