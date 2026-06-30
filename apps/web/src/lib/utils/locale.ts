import { parsePreferredLanguage } from "@/lib/constants/languages";
import type { PreferredLanguage } from "@/types";

/** Map stored language preference to a BCP 47 locale for date/number formatting. */
export function localeFromLanguage(language: PreferredLanguage | string | null | undefined): string {
  return parsePreferredLanguage(language ?? undefined);
}
