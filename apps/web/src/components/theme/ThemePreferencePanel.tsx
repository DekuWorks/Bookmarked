"use client";

import { useThemePreference } from "@/components/theme/ThemeProvider";
import { useToast } from "@/components/ui/Toast";
import type { ThemePreference } from "@/lib/theme/storage";
import { cn } from "@/lib/utils/cn";

const OPTIONS: { id: ThemePreference; label: string; description: string }[] = [
  { id: "light", label: "Light", description: "Lavender-tinted light theme" },
  { id: "dark", label: "Dark", description: "Deep purple night mode (not pure black)" },
  { id: "system", label: "System", description: "Match your device setting" },
];

export function ThemePreferencePanel() {
  const { preference, setPreference } = useThemePreference();
  const toast = useToast();

  function handleSelect(next: ThemePreference) {
    if (next === preference) return;
    setPreference(next);
    toast.success("Saved");
  }

  return (
    <section className="surface-card p-5 text-left">
      <h2 className="font-display text-lg font-semibold text-puce-red">Appearance</h2>
      <p className="mt-1 text-sm text-text-muted">
        Dark mode uses a rich purple palette instead of solid black.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleSelect(option.id)}
            className={cn(
              "rounded-xl border px-4 py-3 text-left transition",
              preference === option.id
                ? "border-primary bg-primary/15 shadow-sm"
                : "border-border bg-background hover:border-primary/30"
            )}
            aria-pressed={preference === option.id}
          >
            <span className="block text-sm font-semibold text-text">{option.label}</span>
            <span className="mt-1 block text-xs leading-relaxed text-text-muted">
              {option.description}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
