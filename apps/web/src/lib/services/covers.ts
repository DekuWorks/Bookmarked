/**
 * Cover resolution for catalog books.
 * New covers come from ISBNdb `image` / `image_original` stored as `cover_url`.
 * Existing Open Library cover URLs in the DB continue to display until refreshed.
 */

export type CoverInput = {
  coverUrl?: string | null;
  /** @deprecated Covered by coverUrl from ISBNdb */
  coverId?: number | string | null;
  isbn?: string | null;
  title?: string;
  author?: string | null;
};

/** Sync resolution for display — prefer stored ISBNdb (or legacy) cover URL. */
export function resolveDisplayCoverUrl(input: CoverInput): string | null {
  if (input.coverUrl?.trim()) return input.coverUrl.trim();
  return null;
}

/**
 * Best-effort cover URL for catalog upserts.
 * Does not call Open Library or Google Books — callers should pass ISBNdb image URLs.
 */
export async function resolveBookCoverUrl(input: CoverInput): Promise<string | null> {
  return resolveDisplayCoverUrl(input);
}
