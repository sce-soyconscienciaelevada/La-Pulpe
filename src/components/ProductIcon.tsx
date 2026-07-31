// Replaces the raw product.emoji rendering across the app. Emoji read as a
// hobby-project signal (flagged directly by Joan — "iconos mas maduros o
// ningun icono"); these are muted single-color line icons matching the
// Sidebar's existing icon set (same viewBox/stroke convention), derived from
// the product's CATEGORY rather than a per-product emoji, since the category
// is what actually determines "what kind of glass" a drink is. Categories
// that aren't a drink (Cristalería, Descartables, Frutas y Extras) render no
// icon at all — the other half of what Joan asked for.

function svgProps() {
  return {
    viewBox: "0 0 24 24",
    width: 20,
    height: 20,
    className: "w-full h-full",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

const DrinkIcon = {
  Beer: () => (
    <svg {...svgProps()}>
      <path d="M6 9h9v10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z" />
      <path d="M6 9l.5-3.5A1 1 0 0 1 7.5 4.5h6a1 1 0 0 1 1 1.1L14.5 9" />
      <path d="M15 11h2a1.5 1.5 0 0 1 1.5 1.5v3A1.5 1.5 0 0 1 17 17h-2" />
      <path d="M8 6.5h5" />
    </svg>
  ),
  Wine: () => (
    <svg {...svgProps()}>
      <path d="M7 4h10c0 4.5-2 7.5-5 7.5S7 8.5 7 4z" />
      <path d="M12 11.5V19M8.5 20h7" />
    </svg>
  ),
  Cocktail: () => (
    <svg {...svgProps()}>
      <path d="M7 5h10l-4.2 6.8V19M12 19h-3.5M12 19h3.5" />
      <path d="M8.3 8h7.4" />
    </svg>
  ),
  Soda: () => (
    <svg {...svgProps()}>
      <path d="M8 5h8l-.8 14a1 1 0 0 1-1 .9H9.8a1 1 0 0 1-1-.9z" />
      <path d="M7.7 9h8.6" />
      <path d="M14.5 5V2.5M14.5 2.5h1.5" />
    </svg>
  ),
  Coffee: () => (
    <svg {...svgProps()}>
      <path d="M5.5 9h11v6a3.5 3.5 0 0 1-3.5 3.5h-4A3.5 3.5 0 0 1 5.5 15z" />
      <path d="M16.5 10.5H18a2 2 0 0 1 0 4h-1.5" />
      <path d="M8.5 5.5c0 1-1 1-1 2M12 5.5c0 1-1 1-1 2" />
    </svg>
  ),
};

// Order matters: "sin alcohol" must be checked before the bare "alcohol"
// match, since it contains that substring too.
function iconForCategory(categoryName: string | null | undefined): (() => React.JSX.Element) | null {
  if (!categoryName) return null;
  const name = categoryName.toLowerCase();
  if (name.includes("cerveza")) return DrinkIcon.Beer;
  if (name.includes("vino") || name.includes("espumante")) return DrinkIcon.Wine;
  if (name.includes("sin alcohol") || name.includes("gaseosa")) return DrinkIcon.Soda;
  if (name.includes("café") || name.includes("cafe")) return DrinkIcon.Coffee;
  if (name.includes("alcohol")) return DrinkIcon.Cocktail;
  return null;
}

export function ProductIcon({ categoryName, className }: { categoryName?: string | null; className?: string }) {
  const Icon = iconForCategory(categoryName);
  if (!Icon) return null;
  return (
    <span className={className ?? "inline-block w-5 h-5 text-text-muted"}>
      <Icon />
    </span>
  );
}
