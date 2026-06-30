import { parsePreferredLanguage } from "@/lib/constants/languages";
import type { PreferredLanguage } from "@/types";

/** Map profile language codes to Open Library search language codes. */
export const PREFERRED_TO_OPEN_LIBRARY: Record<PreferredLanguage, string> = {
  en: "eng",
  es: "spa",
  fr: "fre",
  de: "ger",
};

export function preferredLanguageToOpenLibrary(
  language: PreferredLanguage | string | null | undefined
): string | undefined {
  const code = parsePreferredLanguage(language ?? undefined);
  return PREFERRED_TO_OPEN_LIBRARY[code];
}

/** Resolve effective Open Library language from URL `lang` param and profile default. */
export function resolveSearchLanguage(
  urlLang: string | null,
  preferredOpenLibraryLang: string | undefined
): string | undefined {
  if (urlLang === "any") return undefined;
  if (urlLang) return urlLang;
  return preferredOpenLibraryLang;
}

/** Value for the language filter select (empty string = any language). */
export function resolveSearchLanguageFilterValue(
  urlLang: string | null,
  preferredOpenLibraryLang: string | undefined
): string {
  if (urlLang === "any") return "";
  if (urlLang) return urlLang;
  return preferredOpenLibraryLang ?? "";
}
