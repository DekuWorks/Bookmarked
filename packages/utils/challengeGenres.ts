/**
 * Stable genre IDs for challenge rules.
 * Subjects from the catalog map only through this table — never inferred from names.
 */

export const STABLE_GENRE_IDS = [
  "fantasy",
  "romance",
  "mystery",
  "thriller",
  "literary",
  "sci-fi",
  "nonfiction",
  "memoir",
  "horror",
  "ya",
  "classics",
  "contemporary",
] as const;

export type StableGenreId = (typeof STABLE_GENRE_IDS)[number];

const GENRE_SET = new Set<string>(STABLE_GENRE_IDS);

const SUBJECT_ALIASES: Record<string, StableGenreId> = {
  fantasy: "fantasy",
  "epic fantasy": "fantasy",
  "urban fantasy": "fantasy",
  romance: "romance",
  "romantic fiction": "romance",
  mystery: "mystery",
  "detective": "mystery",
  "crime": "mystery",
  thriller: "thriller",
  "suspense": "thriller",
  literary: "literary",
  "literary fiction": "literary",
  "sci-fi": "sci-fi",
  "science fiction": "sci-fi",
  "scifi": "sci-fi",
  "sf": "sci-fi",
  nonfiction: "nonfiction",
  "non-fiction": "nonfiction",
  memoir: "memoir",
  autobiography: "memoir",
  horror: "horror",
  ya: "ya",
  "young adult": "ya",
  "young-adult": "ya",
  classics: "classics",
  classic: "classics",
  contemporary: "contemporary",
  "contemporary fiction": "contemporary",
};

export function isStableGenreId(value: string | null | undefined): value is StableGenreId {
  return Boolean(value && GENRE_SET.has(value));
}

export function normalizeSubjectToken(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Map catalog subjects onto stable IDs. Unknown subjects are dropped — never guessed.
 * Author names and identity/representation are not inputs here.
 */
export function mapSubjectsToGenreIds(subjects: Array<string | null | undefined> | null | undefined): StableGenreId[] {
  if (!subjects?.length) return [];
  const matched = new Set<StableGenreId>();
  for (const subject of subjects) {
    if (!subject) continue;
    const token = normalizeSubjectToken(subject);
    const mapped = SUBJECT_ALIASES[token];
    if (mapped) matched.add(mapped);
  }
  return STABLE_GENRE_IDS.filter((id) => matched.has(id));
}

export function genreIdsOverlap(
  bookGenreIds: readonly string[],
  requiredGenreIds: readonly string[] | null | undefined
): boolean {
  if (!requiredGenreIds?.length) return false;
  const bookSet = new Set(bookGenreIds.filter(isStableGenreId));
  return requiredGenreIds.some((id) => isStableGenreId(id) && bookSet.has(id));
}

/**
 * Identity / representation must come from trusted curated metadata or lists.
 * Never infer from author or character names.
 */
export function representationTagsMatch(
  trustedTags: readonly string[] | null | undefined,
  requiredTags: readonly string[] | null | undefined
): boolean {
  if (!requiredTags?.length) return true;
  if (!trustedTags?.length) return false;
  const have = new Set(trustedTags.map((tag) => tag.trim().toLocaleLowerCase()).filter(Boolean));
  return requiredTags.every((tag) => have.has(tag.trim().toLocaleLowerCase()));
}
