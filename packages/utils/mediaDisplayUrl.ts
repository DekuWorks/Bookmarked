/**
 * Display-time URL rewrites for covers and GIFs.
 *
 * Stored URLs stay as-is (upload / catalog ingest). Callers pick a smaller
 * variant for inline tiles, then fall back to the original if that 404s.
 */

export const COVER_IMAGE_REFERRER_POLICY = "no-referrer" as const;

export type CoverDisplaySize = "thumb" | "detail";

export type MediaDisplaySource = {
  displayUrl: string;
  fallbackUrl: string | null;
};

export function resolveFeedImageLoading(priority?: boolean): "eager" | "lazy" {
  return priority ? "eager" : "lazy";
}

function tryParseUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function withHttps(url: URL): URL {
  if (url.protocol === "http:") {
    url.protocol = "https:";
  }
  return url;
}

function isOpenLibraryCoverHost(hostname: string): boolean {
  return hostname === "covers.openlibrary.org";
}

function isGoogleBooksHost(hostname: string): boolean {
  return (
    hostname === "books.google.com" ||
    hostname === "books.googleusercontent.com" ||
    hostname.endsWith(".googleusercontent.com")
  );
}

function rewriteOpenLibraryPath(pathname: string, size: CoverDisplaySize): string {
  const token = size === "thumb" ? "M" : "L";
  return pathname.replace(/-[sml](\.[a-z0-9]+)$/i, `-${token}$1`);
}

function rewriteGoogleBooksZoom(url: URL, size: CoverDisplaySize): URL {
  if (!url.searchParams.has("zoom")) return url;
  const current = url.searchParams.get("zoom");
  if (size === "thumb") {
    if (current === "2" || current === "3" || current === "4") {
      url.searchParams.set("zoom", "1");
    } else if (current === "0") {
      url.searchParams.set("zoom", "1");
    }
    return url;
  }
  if (current === "0") {
    url.searchParams.set("zoom", "1");
  } else if (current === "3" || current === "4") {
    url.searchParams.set("zoom", "2");
  }
  return url;
}

/** Smaller cover for shelves / search; larger for book details. */
export function resolveCoverDisplaySource(
  url: string,
  size: CoverDisplaySize = "thumb"
): MediaDisplaySource {
  const trimmed = url.trim();
  const parsed = tryParseUrl(trimmed);
  if (!parsed) {
    return { displayUrl: trimmed, fallbackUrl: null };
  }

  const original = withHttps(new URL(parsed.toString())).toString();
  let next = new URL(original);

  if (isOpenLibraryCoverHost(next.hostname)) {
    next.pathname = rewriteOpenLibraryPath(next.pathname, size);
  } else if (isGoogleBooksHost(next.hostname)) {
    next = rewriteGoogleBooksZoom(next, size);
  }

  const displayUrl = next.toString();
  return {
    displayUrl,
    fallbackUrl: displayUrl === original ? null : original,
  };
}

export function resolveCoverDisplayUrl(
  url: string | null | undefined,
  size: CoverDisplaySize = "thumb"
): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  return resolveCoverDisplaySource(trimmed, size).displayUrl;
}

const GIPHY_ALREADY_INLINE =
  /\/(giphy-downsized(?:-medium|-small)?|giphy-preview|200w(?:_d)?|fixed_height)/i;

function isGiphyMediaHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return (
    lower === "giphy.com" ||
    lower === "www.giphy.com" ||
    lower === "media.giphy.com" ||
    lower === "i.giphy.com" ||
    lower.endsWith(".giphy.com")
  );
}

/**
 * Inline Feed GIF — prefer Giphy's downsized animated file.
 * Viewer / fallback keeps the stored original so animation still works.
 */
export function resolveGiphyInlineSource(url: string): MediaDisplaySource {
  const trimmed = url.trim();
  const parsed = tryParseUrl(trimmed);
  if (!parsed || !isGiphyMediaHost(parsed.hostname)) {
    return { displayUrl: trimmed, fallbackUrl: null };
  }

  const host = parsed.hostname.toLowerCase();
  if (host === "i.giphy.com" || GIPHY_ALREADY_INLINE.test(parsed.pathname)) {
    return { displayUrl: trimmed, fallbackUrl: null };
  }

  const nextPath = parsed.pathname.replace(
    /\/(giphy|original)\.(gif|webp)$/i,
    "/giphy-downsized.gif"
  );
  if (nextPath === parsed.pathname) {
    return { displayUrl: trimmed, fallbackUrl: null };
  }

  parsed.pathname = nextPath;
  return { displayUrl: parsed.toString(), fallbackUrl: trimmed };
}

export function resolveFeedInlineImageSource(
  url: string,
  isGif: boolean
): MediaDisplaySource {
  if (isGif) return resolveGiphyInlineSource(url);
  return { displayUrl: url, fallbackUrl: null };
}
