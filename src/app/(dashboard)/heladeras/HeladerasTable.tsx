"use client";

import { useState, useTransition, Fragment } from "react";
import { useRouter } from "next/navigation";
import { recordTempEntry, addFridgeIncident, deleteFridgeIncident } from "./actions";
import { Card, Table, Badge } from "@/components/ui";
import { DAY_LABELS, computeFridgeStatus, FRIDGE_STATUS_LABEL, type FridgeStatus } from "@/lib/fridge-shared";

type UnitRow = { id: string; code: string; name: string; temps: Record<string, number | null> };
type Incident = {
  id: string;
  date: string;
  unitCode: string;
  unitId: string;
  tempRecorded: number | null;
  actionTaken: string;
  responsibleName: string | null;
};
type Person = { id: string; name: string };

function statusTone(status: FridgeStatus): "profit" | "comp" | "loss" | "default" {
  if (status === "verde") return "profit";
  if (status === "amarillo") return "comp";
  if (status === "rojo") return "loss";
  return "default";
}

function shiftWeek(anchorKey: string, deltaDays: number): string {
  const d = new Date(`${anchorKey}T00:00:00`);
  d.setDate(d.getDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

export function HeladerasTable({
  weekDates,
  anchorKey,
  units,
  incidents,
  people,
}: {
  weekDates: string[];
  anchorKey: string;
  units: UnitRow[];
  incidents: Incident[];
  people: Person[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [showIncidentForm, setShowIncidentForm] = useState(false);

  function cellKey(unitId: string, day: string) {
    return `${unitId}:${day}`;
  }

  function valueFor(unit: UnitRow, day: string) {
    const draft = drafts[cellKey(unit.id, day)];
    if (draft !== undefined) return draft;
    const v = unit.temps[day];
    return v === null || v === undefined ? "" : String(v);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => router.push(`/heladeras?week=${shiftWeek(weekDates[0], -7)}`))}
          className="rounded-lg border border-border text-text px-3 py-1.5 text-sm disabled:opacity-50"
        >
          ← Semana anterior
        </button>
        <Badge tone="accent">
          {isPending
            ? "Cargando…"
            : `${new Date(`${weekDates[0]}T00:00:00`).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })} al ${new Date(`${weekDates[6]}T00:00:00`).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}`}
        </Badge>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => router.push(`/heladeras?week=${shiftWeek(weekDates[0], 7)}`))}
          className="rounded-lg border border-border text-text px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Semana siguiente →
        </button>
        <a
          href={`/api/reportes/heladeras?week=${weekDates[0]}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-accent text-bg font-semibold px-3 py-1.5 text-sm"
        >
          🖨️ Imprimir reporte
        </a>
      </div>

      <Card>
        <Table>
          <thead>
            <tr className="text-left text-xs text-text-muted border-b border-border">
              <th className="px-3 py-2">Unidad</th>
              {weekDates.map((d, i) => (
                <th key={d} className="px-2 py-2 text-center">
                  {DAY_LABELS[i]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => (
              <Fragment key={unit.id}>
                <tr className="border-b border-border/50">
                  <td className="px-3 py-2 text-text whitespace-nowrap font-medium">
                    {unit.code} — {unit.name}
                  </td>
                  {weekDates.map((day) => (
                    <td key={day} className="px-1 py-1 text-center">
                      <input
                        type="number"
                        step="0.1"
                        value={valueFor(unit, day)}
                        onChange={(e) => setDrafts({ ...drafts, [cellKey(unit.id, day)]: e.target.value })}
                        onBlur={(e) => {
                          const raw = e.target.value;
                          const v = raw === "" ? null : Number(raw);
                          if (v === null || !Number.isNaN(v)) {
                            startTransition(async () => {
                              await recordTempEntry(unit.id, day, v);
                              router.refresh();
                            });
                          }
                        }}
                        className="w-16 rounded-lg border border-border bg-bg-elevated px-2 py-1 text-sm text-text text-center outline-none focus:border-accent"
                      />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border">
                  <td className="px-3 py-1 text-xs text-text-muted">Estado</td>
                  {weekDates.map((day) => {
                    const status = computeFridgeStatus(unit.temps[day]);
                    return (
                      <td key={day} className="px-1 py-1 text-center">
                        <Badge tone={statusTone(status)}>{FRIDGE_STATUS_LABEL[status]}</Badge>
                      </td>
                    );
                  })}
                </tr>
              </Fragment>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-text">¿Algo salió mal? — Incidencias</h3>
          <button onClick={() => setShowIncidentForm(!showIncidentForm)} className="text-sm text-accent underline">
            {showIncidentForm ? "cancelar" : "+ reportar"}
          </button>
        </div>

        {showIncidentForm && (
          <IncidentForm
            units={units}
            people={people}
            weekDates={weekDates}
            onDone={() => {
              setShowIncidentForm(false);
              router.refresh();
            }}
          />
        )}

        {incidents.length === 0 ? (
          <p className="text-sm text-text-muted">Sin incidencias esta semana.</p>
        ) : (
          <Table>
            <thead>
              <tr className="text-left text-xs text-text-muted border-b border-border">
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Heladera</th>
                <th className="px-3 py-2">Temp.</th>
                <th className="px-3 py-2">Acción / Responsable</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr key={inc.id} className="border-b border-border">
                  <td className="px-3 py-2 text-text whitespace-nowrap">
                    {new Date(`${inc.date}T00:00:00`).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-3 py-2 text-text">{inc.unitCode}</td>
                  <td className="px-3 py-2 text-text-muted">{inc.tempRecorded ?? "—"}</td>
                  <td className="px-3 py-2 text-text">
                    {inc.actionTaken}
                    {inc.responsibleName && <span className="text-text-muted"> — {inc.responsibleName}</span>}
                  </td>
                  <td className="px-2 py-2">
                    <button
                      disabled={isPending}
                      onClick={() => {
                        if (!confirm("¿Eliminar esta incidencia?")) return;
                        startTransition(async () => {
                          await deleteFridgeIncident(inc.id);
                          router.refresh();
                        });
                      }}
                      className="text-text-muted text-sm"
                      aria-label="Eliminar incidencia"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function IncidentForm({
  units,
  people,
  weekDates,
  onDone,
}: {
  units: UnitRow[];
  people: Person[];
  weekDates: string[];
  onDone: () => void;
}) {
  const [unitId, setUnitId] = useState(units[0]?.id ?? "");
  const [date, setDate] = useState(weekDates[0]);
  const [tempRecorded, setTempRecorded] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [responsiblePersonId, setResponsiblePersonId] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="grid sm:grid-cols-2 gap-2 mb-4 p-3 rounded-lg border border-border">
      <select
        value={unitId}
        onChange={(e) => setUnitId(e.target.value)}
        className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text"
      >
        {units.map((u) => (
          <option key={u.id} value={u.id}>
            {u.code} — {u.name}
          </option>
        ))}
      </select>
      <select
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text"
      >
        {weekDates.map((d) => (
          <option key={d} value={d}>
            {new Date(`${d}T00:00:00`).toLocaleDateString("es-AR")}
          </option>
        ))}
      </select>
      <input
        type="number"
        step="0.1"
        value={tempRecorded}
        onChange={(e) => setTempRecorded(e.target.value)}
        placeholder="Temp. registrada (opcional)"
        className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text"
      />
      <select
        value={responsiblePersonId}
        onChange={(e) => setResponsiblePersonId(e.target.value)}
        className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text"
      >
        <option value="">Responsable (opcional)</option>
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <textarea
        value={actionTaken}
        onChange={(e) => setActionTaken(e.target.value)}
        placeholder="¿Qué se hizo?"
        className="sm:col-span-2 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text"
        rows={2}
      />
      <button
        disabled={isPending || !actionTaken.trim() || !unitId}
        onClick={() =>
          startTransition(async () => {
            await addFridgeIncident({
              unitId,
              date,
              tempRecorded: tempRecorded === "" ? null : Number(tempRecorded),
              actionTaken,
              responsiblePersonId: responsiblePersonId || null,
            });
            onDone();
          })
        }
        className="sm:col-span-2 rounded-lg bg-accent text-bg font-semibold py-2 text-sm disabled:opacity-50"
      >
        Reportar incidencia
      </button>
    </div>
  );
}
