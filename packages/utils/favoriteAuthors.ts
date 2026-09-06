/**
 * Plus favorite authors — explicit picks only. Never auto-follow.
 */

export const FAVORITE_AUTHOR_MAX_NAME = 120;

export type FavoriteAuthorDraft = {
  authorName: string;
  note?: string | null;
};

export function normalizeAuthorName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function validateFavoriteAuthorName(
  name: string
): { ok: true; name: string } | { ok: false; error: string } {
  const normalized = normalizeAuthorName(name);
  if (!normalized) return { ok: false, error: "Enter an author name." };
  if (normalized.length > FAVORITE_AUTHOR_MAX_NAME) {
    return { ok: false, error: `Author names must be ${FAVORITE_AUTHOR_MAX_NAME} characters or fewer.` };
  }
  return { ok: true, name: normalized };
}

export function favoriteAuthorKey(userId: string, authorName: string): string {
  return `${userId}:${normalizeAuthorName(authorName).toLowerCase()}`;
}
