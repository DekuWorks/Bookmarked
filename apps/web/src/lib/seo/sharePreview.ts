export const SITE_URL = "https://bookmarked.online";
export const SITE_NAME = "Bookmarked";
export const SITE_TAGLINE = "Your reading life, beautifully organized";
export const SITE_DESCRIPTION =
  "A web-first reading platform to search books, manage shelves, track progress, and write reviews.";

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-share.png`;

/** Branded share card with optional book cover and B logo in the footer. */
export function sharePreviewImageUrl(coverUrl?: string | null): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (base && coverUrl?.trim()) {
    return `${base}/functions/v1/share-preview?cover=${encodeURIComponent(coverUrl.trim())}`;
  }
  return DEFAULT_OG_IMAGE;
}
