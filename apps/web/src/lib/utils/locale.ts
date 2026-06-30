import { parsePreferredLanguage } from "@/lib/constants/languages";
import type { PreferredLanguage } from "@/types";

/** Map stored language preference to a BCP 47 locale for date/number formatting. */
export function localeFromLanguage(language: PreferredLanguage | string | null | undefined): string {
  return parsePreferredLanguage(language ?? undefined);
}

/** Browser locale when no profile preference is available. */
export function getBrowserLocale(): string {
  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language;
  }
  return "en";
}

export function formatFeedTimestamp(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatReviewDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale);
}
