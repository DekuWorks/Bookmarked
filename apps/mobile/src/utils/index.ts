export function parseGenreList(input: string): string[] {
  return input
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
}
