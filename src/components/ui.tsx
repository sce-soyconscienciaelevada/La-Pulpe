export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-xl sm:text-2xl font-semibold text-text">{title}</h1>
      {subtitle && <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>}
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
    <div className={`bg-bg-card border border-border rounded-xl p-4 sm:p-5 ${className}`}>
      {children}
    </div>
  );
}

export function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "profit" | "loss" | "comp";
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
    <Card className="min-w-0">
      <div className="text-xs uppercase tracking-wide text-text-muted mb-1">{label}</div>
      <div className={`text-2xl font-bold truncate ${toneClass}`}>{value}</div>
    </Card>
  );
}

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm min-w-max">{children}</table>
    </div>
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
            : "bg-border text-text-muted";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${toneClass}`}>
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
