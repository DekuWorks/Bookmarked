export const COMPLETION_TAGS = [
  "Finished",
  "Favorite",
  "First Read",
  "Re-read",
  "Five Star",
] as const;

export type CompletionTag = (typeof COMPLETION_TAGS)[number];

export function computeCompletionTags(input: {
  readCount: number;
  isFavorite: boolean;
  rating?: number | null;
}): CompletionTag[] {
  const tags: CompletionTag[] = ["Finished"];
  if (input.isFavorite) tags.push("Favorite");
  if (input.readCount <= 1) tags.push("First Read");
  else tags.push("Re-read");
  if (input.rating != null && Number(input.rating) >= 5) tags.push("Five Star");
  return tags;
}

export function mergeCompletionTags(
  existing: string[] | null | undefined,
  next: string[]
): string[] {
  return Array.from(new Set([...(existing ?? []), ...next]));
}
