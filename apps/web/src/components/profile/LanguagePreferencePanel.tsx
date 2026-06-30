"use client";

import { useState } from "react";
import { PREFERRED_LANGUAGES } from "@/lib/constants/languages";
import { updatePreferredLanguage } from "@/lib/services/profile";
import { useToast } from "@/components/ui/Toast";
import type { Profile, PreferredLanguage } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  profile: Profile;
  onLanguageChange?: (language: PreferredLanguage) => void;
};

export function LanguagePreferencePanel({ profile, onLanguageChange }: Props) {
  const toast = useToast();
  const [language, setLanguage] = useState<PreferredLanguage>(
    profile.preferred_language ?? "en"
  );
  const [saving, setSaving] = useState(false);

  async function handleChange(next: PreferredLanguage) {
    setLanguage(next);
    setSaving(true);
    const result = await updatePreferredLanguage(profile.id, next);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      setLanguage(profile.preferred_language ?? "en");
      return;
    }

    onLanguageChange?.(next);
    toast.success("Language preference saved.");
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-puce-red">Language</h2>
      <p className="mt-1 text-sm text-text-muted">
        Choose your preferred language. UI translation is coming soon — this setting will be used
        for dates and future localized content.
      </p>

      <div className="mt-4">
        <label htmlFor="preferred-language" className="mb-1.5 block text-sm font-medium text-text">
          Preferred language
        </label>
        <select
          id="preferred-language"
          value={language}
          disabled={saving}
          onChange={(event) => void handleChange(event.target.value as PreferredLanguage)}
          className={cn(
            "w-full max-w-xs rounded-lg border border-border bg-surface px-4 py-2.5 text-text",
            "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          )}
        >
          {PREFERRED_LANGUAGES.map(({ code, label }) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-3 text-xs text-text-muted">UI translation coming soon.</p>
    </section>
  );
}
