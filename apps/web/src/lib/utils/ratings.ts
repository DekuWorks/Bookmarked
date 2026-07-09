export function isValidHalfStarRating(value: number): boolean {
  return value >= 0.5 && value <= 5 && Number.isInteger(value * 2);
}

export function parseHalfStarRating(raw: FormDataEntryValue | null): number | null {
  if (raw == null || raw === "") return null;
  const value = Number(raw);
  if (!isValidHalfStarRating(value)) return null;
  return value;
}

export function formatStarRating(value: number): string {
  return value % 1 === 0 ? String(value) : value.toFixed(1);
}

export function readNumberLabel(readNumber: number): string {
  if (readNumber === 1) return "First Read";
  if (readNumber === 2) return "Second Read";
  if (readNumber === 3) return "Third Read";
  return `Read #${readNumber}`;
}
