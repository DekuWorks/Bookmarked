import type { PreferredLanguage } from "@/types";

export const PREFERRED_LANGUAGES: { code: PreferredLanguage; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
];

export const PREFERRED_LANGUAGE_CODES = PREFERRED_LANGUAGES.map((lang) => lang.code);

export function parsePreferredLanguage(value: string | null | undefined): PreferredLanguage {
  if (value && PREFERRED_LANGUAGE_CODES.includes(value as PreferredLanguage)) {
    return value as PreferredLanguage;
  }
  return "en";
}
