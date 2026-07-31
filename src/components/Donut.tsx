// Ported from the approved mockup
// (_design/dashboards/barmgmt-premium/pages/mockup-d-salon.html) — stacked
// stroke-dasharray circles rotated -90deg, total in the middle, legend with
// dot + name + value + percent below.

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
  formatValue,
}: {
  items: DonutItem[];
  total: number;
  totalLabel?: string;
  formatValue: (n: number) => string;
}) {
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
        color: RAMP[i % RAMP.length],
        dasharray: `${dash.toFixed(1)} ${CIRCUMFERENCE.toFixed(1)}`,
        dashoffset: -offset,
      };
      offset += dash;
      return seg;
    });

  const ariaLabel = items
    .filter((i) => i.value > 0)
    .map((i) => `${i.label} ${((i.value / total) * 100).toFixed(0)}%`)
    .join(", ");

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-36 h-36 shrink-0" role="img" aria-label={ariaLabel}>
        <g transform="rotate(-90 50 50)" fill="none" strokeWidth={13}>
          {segments.map((s) => (
            <circle
              key={s.key}
              cx={50}
              cy={50}
              r={R}
              stroke={s.color}
              strokeDasharray={s.dasharray}
              strokeDashoffset={s.dashoffset}
            />
          ))}
        </g>
        <text x={50} y={49} textAnchor="middle" fill="var(--text)" fontSize={13} fontFamily="var(--font-serif)">
          {formatValue(total)}
        </text>
        <text x={50} y={60} textAnchor="middle" fill="var(--text-faint)" fontSize={6} fontFamily="var(--font-mono)" letterSpacing="0.05em">
          {totalLabel}
        </text>
      </svg>
      <ul className="flex-1 min-w-0 w-full space-y-1.5">
        {items.map((item, i) => (
          <li key={item.key} className="flex items-center gap-2 text-xs text-text-muted min-w-0">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: RAMP[i % RAMP.length] }} />
            <span className="truncate">{item.label}</span>
            <span className="ml-auto font-mono tabular-nums shrink-0">{formatValue(item.value)}</span>
            <span className="font-mono text-text-faint tabular-nums shrink-0 w-9 text-right">
              {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
