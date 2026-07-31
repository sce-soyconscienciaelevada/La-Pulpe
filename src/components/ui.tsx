import Link from "next/link";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text mb-3">
      ← {label}
    </Link>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <div className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-text-faint mb-1.5">
            {eyebrow}
          </div>
        )}
        <h1 className="font-serif text-2xl sm:text-3xl font-normal leading-tight text-text text-balance">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-text-muted mt-1 max-w-prose">{subtitle}</p>}
      </div>
      {action && <div className="flex gap-2 flex-wrap shrink-0">{action}</div>}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-bg-card border border-border rounded-md p-4 sm:p-5 ${className}`}>
      {children}
    </div>
  );
}

export function SectionHead({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 mb-3">
      <h2 className="font-serif text-lg font-normal text-text">{title}</h2>
      <div className="flex items-center gap-3 shrink-0">
        {hint && <span className="font-mono text-xs text-text-faint whitespace-nowrap">{hint}</span>}
        {action}
      </div>
    </div>
  );
}

// One bordered box, ruled dividers between cells — replaces StatTile's
// separate-card-per-metric layout. `delta` is left as a full ReactNode (not a
// fixed prop shape) so callers can compose "% + absolute + context" once that
// comparison data exists, without KpiBox needing to know its shape.
export function KpiBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 bg-bg-card border border-border rounded-md overflow-hidden">
      {children}
    </div>
  );
}

export function Kpi({
  icon,
  label,
  value,
  tone = "default",
  delta,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "profit" | "loss" | "comp";
  delta?: React.ReactNode;
}) {
  const toneClass =
    tone === "profit"
      ? "text-profit"
      : tone === "loss"
        ? "text-loss"
        : tone === "comp"
          ? "text-comp"
          : "text-text";
  return (
    <div
      className={`
        min-w-0 p-4 border-border
        [&:nth-child(2n)]:border-l lg:[&:nth-child(2n)]:border-l-0
        lg:[&:not(:first-child)]:border-l
        [&:nth-child(n+3)]:border-t lg:[&:nth-child(n+3)]:border-t-0
      `}
    >
      <div className="flex items-center gap-1.5 text-xs text-text-muted">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className={`font-serif text-2xl tabular-nums leading-none mt-2.5 mb-2 truncate ${toneClass}`}>
        {value}
      </div>
      {delta && <div className="flex items-center gap-1.5 flex-wrap text-xs text-text-faint">{delta}</div>}
    </div>
  );
}

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm min-w-max">{children}</table>
    </div>
  );
}

// Pagination / summary row for a Table — sits directly under it, same radius
// language as Card so the pair reads as one unit.
export function TableFoot({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 flex-wrap px-4 py-3 border-t border-border font-mono text-xs text-text-faint">
      {children}
    </div>
  );
}

export function Avatar({ label }: { label: string }) {
  return (
    <span className="inline-grid place-items-center w-6 h-6 rounded-full bg-bg-subtle border border-border font-mono text-[0.625rem] text-text-muted shrink-0">
      {label}
    </span>
  );
}

export function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "profit" | "loss" | "comp" | "accent";
}) {
  const toneClass =
    tone === "profit"
      ? "bg-profit/15 text-profit"
      : tone === "loss"
        ? "bg-loss/15 text-loss"
        : tone === "comp"
          ? "bg-comp/15 text-comp"
          : tone === "accent"
            ? "bg-accent-soft text-accent"
            : "bg-bg-subtle text-text-muted";
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[0.6875rem] tabular-nums whitespace-nowrap ${toneClass}`}
    >
      {children}
    </span>
  );
}

export function formatARS(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(n);
}
