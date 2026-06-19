"use client";

import { useState } from "react";
import { SHELF_CONFIG } from "@/lib/constants/shelves";
import { createClient } from "@/lib/supabase/client";
import {
  SHELF_VISIBILITY_OPTIONS,
  shelfVisibilityLabel,
} from "@/lib/services/shelfVisibility";
import { Button } from "@/components/ui/Button";
import type { Profile, ShelfStatus, ShelfVisibility } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  profile: Profile;
};

function visibilityForProfile(profile: Profile, status: ShelfStatus): ShelfVisibility {
  switch (status) {
    case "want_to_read":
      return profile.shelf_visibility_want_to_read ?? "public";
    case "currently_reading":
      return profile.shelf_visibility_currently_reading ?? "public";
    case "read":
      return profile.shelf_visibility_read ?? "public";
  }
}

export function ShelfPrivacyPanel({ profile }: Props) {
  const [values, setValues] = useState<Record<ShelfStatus, ShelfVisibility>>(() => ({
    want_to_read: visibilityForProfile(profile, "want_to_read"),
    currently_reading: visibilityForProfile(profile, "currently_reading"),
    read: visibilityForProfile(profile, "read"),
  }));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { error: saveError } = await supabase
      .from("profiles")
      .update({
        shelf_visibility_want_to_read: values.want_to_read,
        shelf_visibility_currently_reading: values.currently_reading,
        shelf_visibility_read: values.read,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    setSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    setMessage("Shelf privacy saved.");
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-puce-red">Shelf privacy</h2>
      <p className="mt-1 text-sm text-text-muted">
        Choose who can see each shelf on your public profile and library room.
      </p>

      <ul className="mt-5 space-y-4">
        {SHELF_CONFIG.map((shelf) => (
          <li
            key={shelf.status}
            className="flex flex-col gap-2 rounded-lg border border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-text">
                {shelf.emoji} {shelf.title}
              </p>
              <p className="text-xs text-text-muted">{shelf.description}</p>
            </div>
            <select
              value={values[shelf.status]}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  [shelf.status]: e.target.value as ShelfVisibility,
                }))
              }
              className={cn(
                "min-h-[44px] rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text",
                "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              )}
              aria-label={`${shelf.title} visibility`}
            >
              {SHELF_VISIBILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-text-muted">
        Current:{" "}
        {SHELF_CONFIG.map((shelf) => (
          <span key={shelf.status}>
            {shelf.title} ({shelfVisibilityLabel(values[shelf.status])}){" "}
          </span>
        ))}
      </p>

      {error ? (
        <p className="mt-3 text-sm text-rust" role="alert">
          {error}
        </p>
      ) : null}
      {message ? <p className="mt-3 text-sm text-text-muted">{message}</p> : null}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="mt-4"
        loading={saving}
        onClick={() => void save()}
      >
        Save shelf privacy
      </Button>
    </section>
  );
}
