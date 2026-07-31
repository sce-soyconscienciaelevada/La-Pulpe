"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatARS } from "./ui";

// Ported from the approved mockup
// (_design/dashboards/barmgmt-premium/pages/mockup-d-salon.html) — same
// hover/tap/keyboard tooltip mechanics, rebuilt as a real React component
// against real data instead of the mockup's hardcoded 14 points.

export type ChartPoint = {
  key: string;
  dateLabel: string; // full date for the tooltip, e.g. "lun 27 de julio"
  axisLabel?: string; // short label shown on the x-axis, only some points get one
  current: number;
  previous?: number;
};

export type ChartSeries = { label: string; data: ChartPoint[] };

const VIEW_W = 700;
const VIEW_H = 184;
const PLOT_LEFT = 46;
const PLOT_RIGHT = 674;
const PLOT_TOP = 24;
const PLOT_BOTTOM = 150;

function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) return [min - 1, min, min + 1];
  const span = max - min;
  const step = span / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.round(min + step * i));
}

// `format` is a plain string, not a formatter function: this is a Client
// Component, and functions cannot cross the Server/Client boundary — passing
// one throws "Functions cannot be passed directly to Client Components" at
// request time (which no build or type check catches).
export function ChartCard({
  title,
  headlineLabel,
  series,
  format = "currency",
  currentLegend = "Este período",
  previousLegend = "Período anterior",
}: {
  title?: string;
  headlineLabel: string;
  series: ChartSeries[];
  format?: "currency" | "number";
  currentLegend?: string;
  previousLegend?: string;
}) {
  const formatValue = (n: number) =>
    format === "currency" ? formatARS(n) : new Intl.NumberFormat("es-AR").format(n);
  const [seriesIdx, setSeriesIdx] = useState(0);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  const active = series[seriesIdx] ?? series[0];
  const data = active?.data ?? [];
  const hasPrevious = data.some((d) => d.previous !== undefined);

  const headlineTotal = useMemo(() => data.reduce((s, d) => s + d.current, 0), [data]);

  const { points, ticks, minY, maxY } = useMemo(() => {
    if (data.length === 0) return { points: [], ticks: [], minY: 0, maxY: 1 };
    const values = data.flatMap((d) => (d.previous !== undefined ? [d.current, d.previous] : [d.current]));
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const pad = (rawMax - rawMin) * 0.12 || Math.max(rawMax * 0.1, 1);
    const minY = Math.max(0, rawMin - pad);
    const maxY = rawMax + pad;
    const span = maxY - minY || 1;
    const n = data.length;
    const step = n > 1 ? (PLOT_RIGHT - PLOT_LEFT) / (n - 1) : 0;

    function toY(v: number) {
      return PLOT_BOTTOM - ((v - minY) / span) * (PLOT_BOTTOM - PLOT_TOP);
    }

    const points = data.map((d, i) => ({
      x: n > 1 ? PLOT_LEFT + step * i : (PLOT_LEFT + PLOT_RIGHT) / 2,
      yCur: toY(d.current),
      yPrev: d.previous !== undefined ? toY(d.previous) : null,
      d,
    }));

    return { points, ticks: niceTicks(minY, maxY), minY, maxY };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="bg-bg-card border border-border rounded-md p-8 text-center text-sm text-text-muted">
        Todavía no hay datos suficientes para este gráfico.
      </div>
    );
  }

  const curPath =
    "M" +
    points.map((p) => `${p.x.toFixed(1)},${p.yCur.toFixed(1)}`).join(" L") +
    ` L${PLOT_RIGHT},${PLOT_BOTTOM} L${PLOT_LEFT},${PLOT_BOTTOM} Z`;
  const curLine = "M" + points.map((p) => `${p.x.toFixed(1)},${p.yCur.toFixed(1)}`).join(" L");
  const prevLine = hasPrevious
    ? "M" +
      points
        .filter((p) => p.yPrev !== null)
        .map((p) => `${p.x.toFixed(1)},${(p.yPrev as number).toFixed(1)}`)
        .join(" L")
    : null;

  function deltaOf(point: ChartPoint) {
    if (point.previous === undefined || point.previous === 0) return null;
    return ((point.current - point.previous) / point.previous) * 100;
  }

  function placeTooltip(px: number, py: number) {
    const svg = svgRef.current;
    const wrap = wrapRef.current;
    const tip = tipRef.current;
    if (!svg || !wrap || !tip) return;
    const svgBox = svg.getBoundingClientRect();
    const wrapBox = wrap.getBoundingClientRect();
    const sx = svgBox.width / VIEW_W;
    const sy = svgBox.height / VIEW_H;
    const offsetX = svgBox.left - wrapBox.left + wrap.scrollLeft;
    const offsetY = svgBox.top - wrapBox.top;

    const screenX = px * sx + offsetX;
    const screenY = py * sy + offsetY;
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;

    let top = screenY - th - 12;
    if (top < 0) top = screenY + 14;

    // Centering the tooltip on the point covers the point's own curve segment
    // when it's near an edge — for a point in the left ~35% of the plot, that
    // hides the segment leading up to it (looked like the fill/line vanished
    // on hover). Offset to the side with more room instead of straddling it.
    const plotFrac = (px - PLOT_LEFT) / (PLOT_RIGHT - PLOT_LEFT || 1);
    let left: number;
    if (plotFrac < 0.35) left = screenX + 14;
    else if (plotFrac > 0.65) left = screenX - tw - 14;
    else left = screenX - tw / 2;
    const maxLeft = svgBox.width + offsetX - tw;
    if (left < offsetX) left = offsetX;
    if (left > maxLeft) left = Math.max(offsetX, maxLeft);

    tip.style.transform = `translate(${Math.round(left)}px,${Math.round(top)}px)`;
  }

  const hovered = hoverIdx !== null ? points[hoverIdx] : null;
  const hoveredDelta = hovered ? deltaOf(hovered.d) : null;

  useEffect(() => {
    if (hovered) placeTooltip(hovered.x, hovered.yCur);
  });

  return (
    <section className="bg-bg-card border border-border rounded-md" aria-label={title}>
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5 pb-0">
        <div className="min-w-0">
          <div className="font-serif text-xl sm:text-2xl tabular-nums leading-none text-text truncate">
            {formatValue(headlineTotal)}
          </div>
          <div className="text-xs text-text-muted mt-1.5">{headlineLabel}</div>
        </div>
        {series.length > 1 && (
          <div className="flex gap-0.5 bg-bg-subtle rounded-md p-0.5 shrink-0" role="group" aria-label="Período">
            {series.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => {
                  setSeriesIdx(i);
                  setHoverIdx(null);
                }}
                aria-pressed={i === seriesIdx}
                className={`text-xs rounded px-2.5 py-1 ${
                  i === seriesIdx ? "bg-bg-card text-text font-medium" : "text-text-muted"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5">
        <div ref={wrapRef} className="relative overflow-x-auto">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="block w-full min-w-[520px] h-auto"
            role="img"
            aria-label={`${headlineLabel}: ${data.length} puntos, desde ${data[0].dateLabel} hasta ${data[data.length - 1].dateLabel}. Pasá el mouse o tabulá por los puntos para ver el detalle de cada día.`}
          >
            <g stroke="var(--border-soft)" strokeWidth={1}>
              {ticks.slice(1, -1).map((t, i) => {
                const y = PLOT_BOTTOM - ((t - minY) / (maxY - minY || 1)) * (PLOT_BOTTOM - PLOT_TOP);
                return <line key={i} x1={PLOT_LEFT} y1={y} x2={PLOT_RIGHT} y2={y} />;
              })}
            </g>
            <line x1={PLOT_LEFT} y1={PLOT_BOTTOM} x2={PLOT_RIGHT} y2={PLOT_BOTTOM} stroke="var(--border)" strokeWidth={1} />

            <g fill="var(--text-faint)" fontSize={9} fontFamily="var(--font-mono)">
              {ticks.map((t, i) => {
                const y = PLOT_BOTTOM - ((t - minY) / (maxY - minY || 1)) * (PLOT_BOTTOM - PLOT_TOP);
                return (
                  <text key={i} x={10} y={y + 3}>
                    {Math.round(t)}
                  </text>
                );
              })}
              {points.map(
                (p, i) =>
                  p.d.axisLabel && (
                    <text key={i} x={p.x} y={170} textAnchor="middle">
                      {p.d.axisLabel}
                    </text>
                  )
              )}
            </g>

            {prevLine && (
              <path d={prevLine} fill="none" stroke="var(--text-faint)" strokeWidth={1.4} strokeDasharray="4 3" strokeLinejoin="round" />
            )}
            <path d={curPath} fill="var(--accent)" fillOpacity={0.1} />
            <path d={curLine} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

            {/* Always mounted (never conditionally added/removed) — inserting these as
                new siblings only on hover-start triggered a Chromium repaint glitch that
                left the fill path partially unpainted until the next interaction. Toggling
                opacity instead means the DOM never mutates on hover, just attribute values. */}
            <line
              x1={hovered?.x ?? 0}
              y1={PLOT_TOP}
              x2={hovered?.x ?? 0}
              y2={PLOT_BOTTOM}
              stroke="var(--text-faint)"
              strokeWidth={1}
              strokeDasharray="2 3"
              opacity={hovered ? 1 : 0}
            />
            <circle
              cx={hovered?.x ?? 0}
              cy={hovered?.yPrev ?? 0}
              r={3}
              fill="var(--bg-card)"
              stroke="var(--text-faint)"
              strokeWidth={1.5}
              opacity={hovered && hovered.yPrev !== null ? 1 : 0}
            />
            <circle
              cx={hovered?.x ?? 0}
              cy={hovered?.yCur ?? 0}
              r={4}
              fill="var(--bg-card)"
              stroke="var(--accent)"
              strokeWidth={2}
              opacity={hovered ? 1 : 0}
            />

            <g>
              {points.map((p, i) => {
                const left = i === 0 ? PLOT_LEFT : (points[i - 1].x + p.x) / 2;
                const right = i === points.length - 1 ? PLOT_RIGHT : (p.x + points[i + 1].x) / 2;
                return (
                  <rect
                    key={p.d.key}
                    x={left}
                    y={PLOT_TOP - 6}
                    width={Math.max(right - left, 1)}
                    height={PLOT_BOTTOM - PLOT_TOP + 6}
                    fill="transparent"
                    tabIndex={0}
                    role="img"
                    aria-label={`${p.d.dateLabel}: ${formatValue(p.d.current)}`}
                    onPointerEnter={() => setHoverIdx(i)}
                    onPointerDown={() => setHoverIdx(i)}
                    onFocus={() => setHoverIdx(i)}
                    onBlur={() => setHoverIdx((cur) => (cur === i ? null : cur))}
                  />
                );
              })}
            </g>
          </svg>

          <div
            ref={tipRef}
            role="status"
            aria-live="polite"
            className={`absolute top-0 left-0 pointer-events-none rounded-md min-w-[190px] px-2.5 py-2 font-mono text-[0.6875rem] leading-relaxed shadow-lg z-10 transition-opacity duration-100 ${
              hovered ? "opacity-100" : "opacity-0 invisible"
            }`}
            style={{ background: "var(--bg-elevated)", color: "var(--text)", border: "1px solid var(--border)" }}
          >
            {hovered && (
              <>
                <div className="opacity-70 mb-1">{hovered.d.dateLabel}</div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--accent)" }} />
                  <span className="opacity-85">{currentLegend}</span>
                  <span className="ml-auto tabular-nums">{formatValue(hovered.d.current)}</span>
                </div>
                {hovered.d.previous !== undefined && (
                  <div className="flex items-center gap-1.5 opacity-70">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 opacity-60" style={{ background: "currentColor" }} />
                    <span>{previousLegend}</span>
                    <span className="ml-auto tabular-nums">{formatValue(hovered.d.previous)}</span>
                  </div>
                )}
                {hoveredDelta !== null && (
                  <>
                    <div className="h-px my-1.5 opacity-20" style={{ background: "var(--text)" }} />
                    <div className="flex items-center gap-2">
                      <span style={{ color: hoveredDelta >= 0 ? "var(--profit)" : "var(--loss)" }}>
                        {hoveredDelta >= 0 ? "▲" : "▼"} {Math.abs(hoveredDelta).toFixed(1).replace(".", ",")}%
                      </span>
                      <span className="ml-auto opacity-60">{previousLegend.toLowerCase()}</span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex gap-5 mt-3 text-xs text-text-faint">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 inline-block" style={{ background: "var(--accent)" }} />
            {currentLegend}
          </span>
          {hasPrevious && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-0.5 inline-block" style={{ background: "var(--text-faint)" }} />
              {previousLegend}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
