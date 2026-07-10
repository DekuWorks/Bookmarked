import { parsePreferredLanguage } from "@/lib/constants/languages";
import type { PreferredLanguage } from "@/types";

/** Map profile language codes to catalog search language codes (ISBNdb uses ISO short codes). */
export const PREFERRED_TO_CATALOG: Record<PreferredLanguage, string> = {
  en: "en",
  es: "es",
  fr: "fr",
  de: "de",
};

/** @deprecated Use PREFERRED_TO_CATALOG */
export const PREFERRED_TO_OPEN_LIBRARY = PREFERRED_TO_CATALOG;

export function preferredLanguageToCatalog(
  language: PreferredLanguage | string | null | undefined
): string | undefined {
  const code = parsePreferredLanguage(language ?? undefined);
  return PREFERRED_TO_CATALOG[code];
}

/** @deprecated Use preferredLanguageToCatalog */
export function preferredLanguageToOpenLibrary(
  language: PreferredLanguage | string | null | undefined
): string | undefined {
  return preferredLanguageToCatalog(language);
}

/** Resolve effective catalog language from URL `lang` param and profile default. */
export function resolveSearchLanguage(
  urlLang: string | null,
  preferredCatalogLang: string | undefined
): string | undefined {
  if (urlLang === "any") return undefined;
  if (urlLang) {
    // Accept legacy Open Library codes from older URLs
    const legacy: Record<string, string> = {
      eng: "en",
      spa: "es",
      fre: "fr",
      ger: "de",
      ita: "it",
      por: "pt",
      jpn: "ja",
      kor: "ko",
      chi: "zh",
    };
    return legacy[urlLang] ?? urlLang;
  }
  return preferredCatalogLang;
}

/** Value for the language filter select (empty string = any language). */
export function resolveSearchLanguageFilterValue(
  urlLang: string | null,
  preferredCatalogLang: string | undefined
): string {
  if (urlLang === "any") return "";
  if (urlLang) {
    const legacy: Record<string, string> = {
      eng: "en",
      spa: "es",
      fre: "fr",
      ger: "de",
      ita: "it",
      por: "pt",
      jpn: "ja",
      kor: "ko",
      chi: "zh",
    };
    return legacy[urlLang] ?? urlLang;
  }
  return preferredCatalogLang ?? "";
}
