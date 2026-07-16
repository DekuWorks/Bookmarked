import { absoluteAppUrl } from "@/lib/utils/copyLink";

/** Canonical production origin for auth redirect allow-lists and docs. */
export const PRODUCTION_SITE_URL = "https://bookmarked.online";

/** Absolute URL for Supabase email redirects (signup confirm, password reset). */
export function authRedirectUrl(path: string): string {
  return absoluteAppUrl(path.endsWith("/") || path.includes("?") ? path : `${path}/`);
}
