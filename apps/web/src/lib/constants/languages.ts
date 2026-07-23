import type { PreferredLanguage } from "@/types";
import { PREFERRED_LANGUAGE_CODES, parsePreferredLanguage } from "@/lib/utils/profileValidation";

export const PREFERRED_LANGUAGES: { code: PreferredLanguage; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
];

export { PREFERRED_LANGUAGE_CODES, parsePreferredLanguage };
