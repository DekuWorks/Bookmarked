/**
 * Origin-aware back navigation for Home, Feed, Search, and Library.
 * Never hardcode every Back to Library/Home — resolve from `origin`.
 */

export const NAV_ORIGINS = [
  "home_overview",
  "home_history",
  "feed",
  "search_people",
  "search_books",
  "search_clubs",
  "library_all_books",
  "library_shelf",
] as const;

export type NavOrigin = (typeof NAV_ORIGINS)[number];

export const NAV_ORIGIN_QUERY_PARAM = "origin";
export const NAV_SCROLL_QUERY_PARAM = "scroll";
export const NAV_QUERY_QUERY_PARAM = "q";

export type OriginBackTarget = {
  origin: NavOrigin;
  webHref: string;
  mobileHref: string;
  label: string;
};

const ORIGIN_SET = new Set<string>(NAV_ORIGINS);

export function parseNavOrigin(value: string | null | undefined): NavOrigin | null {
  if (!value) return null;
  return ORIGIN_SET.has(value) ? (value as NavOrigin) : null;
}

export function originSearchParams(input: {
  origin?: string | null;
  query?: string | null;
  scroll?: string | number | null;
  extra?: Record<string, string | null | undefined>;
}): URLSearchParams {
  const params = new URLSearchParams();
  const origin = parseNavOrigin(input.origin);
  if (origin) params.set(NAV_ORIGIN_QUERY_PARAM, origin);
  const query = input.query?.trim();
  if (query) params.set(NAV_QUERY_QUERY_PARAM, query);
  if (input.scroll != null && String(input.scroll).trim()) {
    params.set(NAV_SCROLL_QUERY_PARAM, String(input.scroll));
  }
  if (input.extra) {
    for (const [key, value] of Object.entries(input.extra)) {
      if (value) params.set(key, value);
    }
  }
  return params;
}

export function withOriginQuery(
  path: string,
  input: {
    origin?: string | null;
    query?: string | null;
    scroll?: string | number | null;
    extra?: Record<string, string | null | undefined>;
  }
): string {
  const params = originSearchParams(input);
  const qs = params.toString();
  if (!qs) return path;
  return path.includes("?") ? `${path}&${qs}` : `${path}?${qs}`;
}

export function resolveOriginBack(origin: string | null | undefined): OriginBackTarget | null {
  const parsed = parseNavOrigin(origin);
  if (!parsed) return null;

  switch (parsed) {
    case "home_overview":
      return {
        origin: parsed,
        webHref: "/reading-room/",
        mobileHref: "/?tab=overview",
        label: "Overview",
      };
    case "home_history":
      return {
        origin: parsed,
        webHref: "/reading-room/?tab=history",
        mobileHref: "/?tab=history",
        label: "History",
      };
    case "feed":
      return {
        origin: parsed,
        webHref: "/feed/",
        mobileHref: "/feed",
        label: "Feed",
      };
    case "search_people":
      return {
        origin: parsed,
        webHref: "/search/?cat=people",
        mobileHref: "/search?cat=people",
        label: "Search People",
      };
    case "search_books":
      return {
        origin: parsed,
        webHref: "/search/?cat=books",
        mobileHref: "/search?cat=books",
        label: "Search",
      };
    case "search_clubs":
      return {
        origin: parsed,
        webHref: "/search/?cat=clubs",
        mobileHref: "/search?cat=clubs",
        label: "Search Clubs",
      };
    case "library_all_books":
      return {
        origin: parsed,
        webHref: "/library/",
        mobileHref: "/library/my-books",
        label: "All Books",
      };
    case "library_shelf":
      return {
        origin: parsed,
        webHref: "/library/",
        mobileHref: "/library",
        label: "Library",
      };
  }
}

export function parseNavOriginParam(
  value: string | string[] | null | undefined
): NavOrigin | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return parseNavOrigin(raw);
}

export function originBackLink(
  origin: string | string[] | null | undefined,
  platform: "web" | "mobile",
  fallback: { href: string; label: string }
): { href: string; label: string; origin: NavOrigin | null } {
  const parsed = parseNavOriginParam(origin);
  const target = resolveOriginBack(parsed);
  if (!target) return { ...fallback, origin: null };
  return {
    href: platform === "web" ? target.webHref : target.mobileHref,
    label: `← Back to ${target.label}`,
    origin: target.origin,
  };
}

export function originBackHref(
  origin: string | null | undefined,
  platform: "web" | "mobile",
  extras?: { query?: string | null; scroll?: string | number | null }
): string | null {
  const target = resolveOriginBack(origin);
  if (!target) return null;
  const base = platform === "web" ? target.webHref : target.mobileHref;
  if (!extras?.query && extras?.scroll == null) return base;
  return withOriginQuery(base, { query: extras.query, scroll: extras.scroll });
}

export function restoreSearchHref(
  origin: "search_people" | "search_books" | "search_clubs",
  platform: "web" | "mobile",
  extras?: { query?: string | null; scroll?: string | number | null }
): string {
  const target = resolveOriginBack(origin);
  const base = platform === "web" ? target!.webHref : target!.mobileHref;
  return withOriginQuery(base, { query: extras?.query, scroll: extras?.scroll });
}
