// Pablo types everything lowercase and without accents. Every "name" field
// (product, person, supplier, glassware item, reorder item, free-text
// consumption) runs through this before it hits the database, so the panel
// always shows proper Spanish regardless of how he typed it.
//
// This is a curated dictionary, not a spellchecker: it capitalizes every
// word's initial, always, no Spanish-stopword exceptions — Joan asked for
// "siempre" (always), not formal title-case rules, so "cc"/"con"/"de" get
// capitalized like everything else. Accents are restored only for words
// listed below; anything not in ACCENT_WORDS keeps whatever accents (or lack
// of them) were typed. A word that already has ANY capital letter is left
// completely untouched (see HAS_UPPERCASE below) so already-correct data —
// "Coca-Cola", "IPA" typed right — never gets silently re-mangled. Add new
// bar/drink vocabulary or staff names to the lists below as they come up —
// no code change needed elsewhere, every write point already calls
// properName().

// Words that must render in a specific way regardless of case — acronyms
// that title-casing would otherwise mangle (e.g. "ipa" -> "Ipa").
const EXACT_OVERRIDES: Record<string, string> = {
  ipa: "IPA",
  pos: "POS",
  dj: "DJ",
};

// Common bar/menu vocabulary and Argentine names that need an accent Pablo
// won't type. Keys are lowercase, unaccented; values are the correct
// lowercase, accented spelling (capitalizeWord uppercases the first letter
// afterward). Deliberately NOT auto-pluralizing/conjugating — Spanish accent
// rules shift under inflection (limón -> limones loses the accent), so only
// exact, commonly-typed forms are listed to avoid introducing wrong accents.
const ACCENT_WORDS: Record<string, string> = {
  // drinks / menu
  cafe: "café",
  cafes: "cafés",
  te: "té",
  limon: "limón",
  maracuya: "maracuyá",
  melon: "melón",
  sandia: "sandía",
  daiquiri: "daiquirí",
  champan: "champán",
  coctel: "cóctel",
  cocteles: "cócteles",
  jamon: "jamón",
  salmon: "salmón",
  atun: "atún",
  camaron: "camarón",
  camarones: "camarones",
  tonica: "tónica",
  gaseosa: "gaseosa",
  azucar: "azúcar",
  jarron: "jarrón",
  aji: "ají",
  anana: "ananá",

  // common Argentine first names
  jose: "José",
  maria: "María",
  andres: "Andrés",
  ivan: "Iván",
  nicolas: "Nicolás",
  matias: "Matías",
  tomas: "Tomás",
  agustin: "Agustín",
  adrian: "Adrián",
  sebastian: "Sebastián",
  martin: "Martín",
  ramon: "Ramón",
  joaquin: "Joaquín",
  ines: "Inés",
  jesus: "Jesús",
  raul: "Raúl",
  jonas: "Jonás",
  ruben: "Rubén",
  simon: "Simón",
  angel: "Ángel",
  angela: "Ángela",
  monica: "Mónica",
  veronica: "Verónica",
  aaron: "Aarón",
  damian: "Damián",
  cristian: "Cristián",
  fabian: "Fabián",
  julian: "Julián",
  valentin: "Valentín",

  // common surnames
  perez: "Pérez",
  gonzalez: "González",
  rodriguez: "Rodríguez",
  fernandez: "Fernández",
  martinez: "Martínez",
  sanchez: "Sánchez",
  ramirez: "Ramírez",
  gimenez: "Giménez",
  nuñez: "Núñez",
  paez: "Páez",
};

function capitalizeWord(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

const HAS_UPPERCASE = /[A-ZÁÉÍÓÚÑ]/;

function normalizeWord(word: string): string {
  const lower = word.toLowerCase();
  if (EXACT_OVERRIDES[lower]) return EXACT_OVERRIDES[lower];
  // Already has a capital somewhere (brand name, hyphenated compound like
  // "Coca-Cola", an acronym typed correctly) — leave it exactly as written.
  // Re-title-casing it (Coca-Cola -> Coca-cola) would silently corrupt
  // already-correct data; this only needs to fix Pablo's all-lowercase input.
  if (HAS_UPPERCASE.test(word)) return word;
  const accented = ACCENT_WORDS[lower] ?? word;
  return capitalizeWord(accented);
}

/** Title-cases every word and restores known accents. Safe to call on any
 * short "name"-style field — trims and collapses internal whitespace too. */
export function properName(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, " ");
  if (!trimmed) return trimmed;
  return trimmed.split(" ").map(normalizeWord).join(" ");
}
