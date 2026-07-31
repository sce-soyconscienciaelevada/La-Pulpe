// Ported from the approved mockup
// (_design/dashboards/barmgmt-premium/pages/mockup-d-salon.html) — a single
// horizontal bar split into proportional segments, legend below carries the
// numbers (a percentage row above the bar was tried and dropped: evenly
// spaced labels don't line up with uneven segment widths, see
// _design/design-systems/other/shadcnblocks-admin-design.md).

export type SegmentedBarItem = {
  key: string;
  label: string;
  value: number;
  color: string; // CSS color, e.g. "var(--ramp-1)"
};

export function SegmentedBar({
  items,
  formatValue,
}: {
  items: SegmentedBarItem[];
  formatValue: (n: number) => string;
}) {
  const total = items.reduce((s, i) => s + i.value, 0);

  if (total === 0) {
    return <p className="text-sm text-text-muted">Sin datos todavía.</p>;
  }

  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-bg-subtle">
        {items.map((item) => {
          const pct = (item.value / total) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={item.key}
              style={{ width: `${pct}%`, background: item.color }}
              title={`${item.label}: ${formatValue(item.value)}`}
            />
          );
        })}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-1.5 text-xs text-text-muted min-w-0">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
            <span className="truncate min-w-0 flex-1">{item.label}</span>
            <span className="font-mono text-text-faint tabular-nums shrink-0">
              {((item.value / total) * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
