/**
 * Series detection for ISBNdb catalog data.
 *
 * ISBNdb v2 has no dedicated series field, so we parse series name + position
 * out of the title / title_long strings (and, as a weak fallback, subjects).
 * Common shapes we handle:
 *   "Shadowshaper (The Shadowshaper Cypher, #1)"
 *   "The Fellowship of the Ring (The Lord of the Rings #1)"
 *   "A Game of Thrones (A Song of Ice and Fire, Book 1)"
 *   "Mistborn: The Final Empire (Mistborn, Book 1)"
 *   "Dune (Dune Chronicles, Volume 1)"
 *
 * We only set a series when a position number is clearly present, to keep
 * false positives low (see confidence handling in callers).
 */

export type ParsedSeries = {
  /** Cleaned series name, e.g. "The Shadowshaper Cypher". */
  name: string;
  /** Position within the series (supports decimals like 1.5), or null. */
  position: number | null;
  /** How reliable the parse is. Callers may choose to only store "high". */
  confidence: "high" | "medium";
};

/** Position markers we recognise after the series name. */
const POSITION_LABEL = "(?:#|book|bk\\.?|vol\\.?|volume|part|no\\.?|number)";

/**
 * Matches the interior of a parenthetical, capturing:
 *   group 1: series name
 *   group 2: position (integer or decimal)
 * e.g. "The Shadowshaper Cypher, #1" / "Mistborn Book 1" / "Dune Chronicles, Volume 1.5"
 */
const PAREN_SERIES_RE = new RegExp(
  `^(.+?)[,\\s]*${POSITION_LABEL}\\s*(\\d+(?:\\.\\d+)?)\\s*$`,
  "i"
);

/**
 * Matches a trailing ", Series Name, #1" style on the bare title (no parens).
 * Lower confidence because free text is noisier.
 */
const TRAILING_SERIES_RE = new RegExp(
  `[,:]\\s*(.+?)[,\\s]*${POSITION_LABEL}\\s*(\\d+(?:\\.\\d+)?)\\s*$`,
  "i"
);

/** Parenthetical groups that are editions/formats, never series. */
const NON_SERIES_HINTS = [
  "edition",
  "paperback",
  "hardcover",
  "hardback",
  "unabridged",
  "abridged",
  "illustrated",
  "reprint",
  "revised",
  "anniversary",
  "boxed set",
  "box set",
  "audiobook",
  "audio",
  "large print",
  "ebook",
  "kindle",
  "annotated",
  "deluxe",
  "collector",
];

function cleanSeriesName(raw: string): string | null {
  let name = raw
    .replace(/\s+/g, " ")
    .replace(/[\s,;:-]+$/g, "")
    .replace(/^[\s,;:-]+/g, "")
    .trim();

  // Drop a redundant trailing "Series" label only when it isn't the whole name.
  const withoutSuffix = name.replace(/\s+series$/i, "").trim();
  if (withoutSuffix.length >= 2) name = withoutSuffix;

  if (name.length < 2 || name.length > 120) return null;
  // Reject anything that is purely numeric / punctuation.
  if (!/[a-z]/i.test(name)) return null;
  // Reject obvious edition/format descriptors.
  const lower = name.toLowerCase();
  if (NON_SERIES_HINTS.some((hint) => lower === hint || lower.includes(hint))) {
    return null;
  }
  return name;
}

function toPosition(raw: string): number | null {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0 || value > 999) return null;
  return value;
}

function matchInterior(interior: string): ParsedSeries | null {
  const trimmed = interior.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (NON_SERIES_HINTS.some((hint) => lower.includes(hint))) return null;

  const match = trimmed.match(PAREN_SERIES_RE);
  if (!match) return null;

  const name = cleanSeriesName(match[1]);
  const position = toPosition(match[2]);
  if (!name || position === null) return null;

  return { name, position, confidence: "high" };
}

/** Extract the contents of each parenthetical group in a string. */
function parentheticals(value: string): string[] {
  const out: string[] = [];
  const re = /\(([^()]*)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) {
    if (m[1]?.trim()) out.push(m[1].trim());
  }
  return out;
}

/**
 * Parse series info from an ISBNdb-style title.
 * Prefers `title_long` (usually richer), falls back to `title` and subjects.
 */
export function parseSeries(input: {
  title?: string | null;
  titleLong?: string | null;
  subjects?: string[] | null;
}): ParsedSeries | null {
  const candidates = [input.titleLong, input.title].filter(
    (value): value is string => Boolean(value?.trim())
  );

  // 1. Highest confidence: a parenthetical with a position marker.
  for (const candidate of candidates) {
    for (const interior of parentheticals(candidate)) {
      const parsed = matchInterior(interior);
      if (parsed) return parsed;
    }
  }

  // 2. Medium confidence: trailing ", Series, #N" on the bare title.
  for (const candidate of candidates) {
    const withoutParens = candidate.replace(/\([^()]*\)/g, "").trim();
    const match = withoutParens.match(TRAILING_SERIES_RE);
    if (match) {
      const name = cleanSeriesName(match[1]);
      const position = toPosition(match[2]);
      if (name && position !== null) {
        return { name, position, confidence: "medium" };
      }
    }
  }

  // 3. Weak fallback: a subject explicitly tagged like "Foo (Series)".
  for (const subject of input.subjects ?? []) {
    const seriesTag = subject.match(/^(.+?)\s*\(series\)\s*$/i);
    if (seriesTag) {
      const name = cleanSeriesName(seriesTag[1]);
      if (name) return { name, position: null, confidence: "medium" };
    }
  }

  return null;
}

/** Normalised key for case-insensitive series matching / dedupe. */
export function normalizeSeriesName(name: string): string {
  return name.replace(/\s+/g, " ").trim().toLowerCase();
}
