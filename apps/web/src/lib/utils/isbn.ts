/** Strip separators and normalize ISBN input for lookup. */
export function normalizeIsbnInput(raw: string): string | null {
  const cleaned = raw.replace(/[-\s]/g, "").toUpperCase();
  if (!cleaned) return null;

  if (/^\d{13}$/.test(cleaned)) return cleaned;
  if (/^\d{9}[\dX]$/.test(cleaned)) return cleaned;

  return null;
}

export function isIsbnQuery(raw: string): boolean {
  return normalizeIsbnInput(raw) !== null;
}

export function formatIsbnForSearch(raw: string): string {
  const isbn = normalizeIsbnInput(raw);
  return isbn ?? raw.trim();
}
