export const BOOK_CLUB_BANNER_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
export const BOOK_CLUB_BANNER_MAX_BYTES = 5 * 1024 * 1024;
export const BOOK_CLUB_BANNER_FORMAT_HINT = "JPEG, PNG, WebP, or GIF. Max 5 MB.";

export type BookClubBannerMode = "current_read" | "custom";

export const BOOK_CLUB_BANNER_MODES = ["current_read", "custom"] as const;

export const DEFAULT_BOOK_CLUB_BANNER_MODE: BookClubBannerMode = "current_read";

/** Brand fallback when matching current read but no cover is available. */
export const BOOK_CLUB_DEFAULT_BANNER_GRADIENT = {
  from: "#eb9f8e",
  via: "#c4785a",
  to: "#642F37",
} as const;

export type ClubBannerSource = {
  banner_mode?: BookClubBannerMode | null;
  banner_url?: string | null;
};

export type ClubBannerCurrentBook = {
  cover_url?: string | null;
};

export type ResolvedClubBanner =
  | { kind: "image"; url: string; mode: BookClubBannerMode }
  | { kind: "gradient"; mode: BookClubBannerMode };

export function parseBookClubBannerMode(value: unknown): BookClubBannerMode {
  return value === "custom" ? "custom" : "current_read";
}

/**
 * Resolve what to render for a club banner.
 * - custom → banner_url if present, else brand gradient
 * - current_read → current book cover if present, else brand gradient
 * Custom banner_url is never required when mode is current_read (kept for later).
 *
 * Platforms may further tint current_read (web: cover colour wash; mobile: cover + scrim).
 */
export function resolveClubBanner(
  club: ClubBannerSource,
  currentBook?: ClubBannerCurrentBook | null
): ResolvedClubBanner {
  const mode = parseBookClubBannerMode(club.banner_mode);
  if (mode === "custom") {
    const url = club.banner_url?.trim();
    if (url) return { kind: "image", url, mode };
    return { kind: "gradient", mode };
  }
  const cover = currentBook?.cover_url?.trim();
  if (cover) return { kind: "image", url: cover, mode: "current_read" };
  return { kind: "gradient", mode: "current_read" };
}
