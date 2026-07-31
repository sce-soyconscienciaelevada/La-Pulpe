"use client";

import { useState } from "react";
import { formatARS } from "./ui";

// Ported from the approved mockup
// (_design/dashboards/barmgmt-premium/pages/mockup-d-salon.html) — stacked
// stroke-dasharray circles rotated -90deg, total in the middle, legend with
// dot + name + value + percent below.
//
// Hover/focus on a segment (or its legend row) highlights that segment and
// swaps the center label to show what it is — no floating tooltip, so there
// is nothing that can "move" or feel jittery; only the center text and the
// segment's own opacity/weight change.

const R = 40;
const CIRCUMFERENCE = 2 * Math.PI * R;
const RAMP = ["var(--ramp-1)", "var(--ramp-2)", "var(--ramp-3)", "var(--ramp-4)"];

export type DonutItem = {
  key: string;
  label: string;
  value: number;
};

export function Donut({
  items,
  total,
  totalLabel = "TOTAL",
}: {
  items: DonutItem[];
  total: number;
  totalLabel?: string;
}) {
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  if (total <= 0) {
    return <p className="text-sm text-text-muted">Sin datos todavía.</p>;
  }

  let offset = 0;
  const segments = items
    .filter((i) => i.value > 0)
    .map((item, i) => {
      const frac = item.value / total;
      const dash = frac * CIRCUMFERENCE;
      const seg = {
        key: item.key,
        label: item.label,
        value: item.value,
        pct: frac * 100,
        color: RAMP[i % RAMP.length],
        dasharray: `${dash.toFixed(1)} ${CIRCUMFERENCE.toFixed(1)}`,
        dashoffset: -offset,
      };
      offset += dash;
      return seg;
    });

  const ariaLabel = segments.map((s) => `${s.label} ${s.pct.toFixed(0)}%`).join(", ");
  const hovered = segments.find((s) => s.key === hoverKey) ?? null;

  return (
    <div className="flex flex-col items-center gap-4 min-w-0">
      <svg viewBox="0 0 100 100" className="w-36 h-36 shrink-0" role="img" aria-label={ariaLabel}>
        <g transform="rotate(-90 50 50)" fill="none">
          {segments.map((s) => (
            <circle
              key={s.key}
              cx={50}
              cy={50}
              r={R}
              stroke={s.color}
              strokeWidth={hovered && hovered.key === s.key ? 15 : 13}
              strokeDasharray={s.dasharray}
              strokeDashoffset={s.dashoffset}
              opacity={hovered && hovered.key !== s.key ? 0.35 : 1}
              tabIndex={0}
              role="img"
              aria-label={`${s.label}: ${formatARS(s.value)}, ${s.pct.toFixed(0)}%`}
              className="cursor-pointer outline-none transition-[stroke-width,opacity] duration-150"
              onPointerEnter={() => setHoverKey(s.key)}
              onPointerLeave={() => setHoverKey((cur) => (cur === s.key ? null : cur))}
              onFocus={() => setHoverKey(s.key)}
              onBlur={() => setHoverKey((cur) => (cur === s.key ? null : cur))}
            />
          ))}
        </g>
        {hovered ? (
          <>
            <text x={50} y={46} textAnchor="middle" fill="var(--text)" fontSize={9} fontFamily="var(--font-sans)">
              {hovered.label.length > 14 ? `${hovered.label.slice(0, 13)}…` : hovered.label}
            </text>
            <text x={50} y={57} textAnchor="middle" fill="var(--text)" fontSize={11} fontFamily="var(--font-serif)">
              {formatARS(hovered.value)}
            </text>
            <text x={50} y={66} textAnchor="middle" fill="var(--text-faint)" fontSize={6} fontFamily="var(--font-mono)" letterSpacing="0.05em">
              {hovered.pct.toFixed(0)}%
            </text>
          </>
        ) : (
          <>
            <text x={50} y={49} textAnchor="middle" fill="var(--text)" fontSize={13} fontFamily="var(--font-serif)">
              {formatARS(total)}
            </text>
            <text x={50} y={60} textAnchor="middle" fill="var(--text-faint)" fontSize={6} fontFamily="var(--font-mono)" letterSpacing="0.05em">
              {totalLabel}
            </text>
          </>
        )}
      </svg>
      <ul className="flex-1 min-w-0 w-full space-y-1.5">
        {segments.map((s) => (
          <li
            key={s.key}
            onPointerEnter={() => setHoverKey(s.key)}
            onPointerLeave={() => setHoverKey((cur) => (cur === s.key ? null : cur))}
            className={`flex items-center gap-2 text-xs min-w-0 rounded px-1 -mx-1 cursor-pointer transition-colors ${
              hovered?.key === s.key ? "bg-bg-elevated text-text" : "text-text-muted"
            }`}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="truncate min-w-0 flex-1">{s.label}</span>
            <span className="ml-auto font-mono tabular-nums shrink-0">{formatARS(s.value)}</span>
            <span className="font-mono text-text-faint tabular-nums shrink-0 w-9 text-right">{s.pct.toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
