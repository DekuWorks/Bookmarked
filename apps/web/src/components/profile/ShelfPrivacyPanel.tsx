"use client";

import { useCallback, useEffect, useState } from "react";
import { getShelvesInOrder } from "@/lib/constants/shelves";
import { ShelfTitleRow } from "@/components/shelves/ShelfTitleRow";
import { createClient } from "@/lib/supabase/client";
import {
  SHELF_VISIBILITY_OPTIONS,
  shelfVisibilityLabel,
} from "@/lib/services/shelfVisibility";
import {
  listUserCustomShelves,
  updateCustomShelfVisibility,
} from "@/lib/services/customShelves";
import { CreateShelfButton } from "@/components/shelves/CreateShelfButton";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { Profile, ShelfStatus, ShelfVisibility, UserShelf } from "@/types";
import { cn } from "@/lib/utils/cn";
import { validateShelfVisibility } from "@/lib/utils/profileValidation";

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
    case "dnf":
      return profile.shelf_visibility_dnf ?? "private";
  }
}

export function ShelfPrivacyPanel({ profile }: Props) {
  const toast = useToast();
  const [values, setValues] = useState<Record<ShelfStatus, ShelfVisibility>>(() => ({
    want_to_read: visibilityForProfile(profile, "want_to_read"),
    currently_reading: visibilityForProfile(profile, "currently_reading"),
    read: visibilityForProfile(profile, "read"),
    dnf: visibilityForProfile(profile, "dnf"),
  }));
  const [customShelves, setCustomShelves] = useState<UserShelf[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, ShelfVisibility>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCustomShelves = useCallback(async () => {
    const shelves = await listUserCustomShelves(profile.id);
    setCustomShelves(shelves);
    setCustomValues(
      Object.fromEntries(shelves.map((shelf) => [shelf.id, shelf.visibility]))
    );
  }, [profile.id]);

  useEffect(() => {
    void refreshCustomShelves().catch((err) => {
      console.error("[shelf-privacy] custom shelves load failed:", err);
    });
  }, [refreshCustomShelves]);

  async function save() {
    setSaving(true);
    setError(null);

    for (const shelf of getShelvesInOrder()) {
      const result = validateShelfVisibility(values[shelf.status]);
      if (!result.ok) {
        setSaving(false);
        setError(result.error);
        return;
      }
    }

    for (const shelf of customShelves) {
      const visibility = customValues[shelf.id] ?? shelf.visibility;
      const result = validateShelfVisibility(visibility);
      if (!result.ok) {
        setSaving(false);
        setError(result.error);
        return;
      }
    }

    const supabase = createClient();
    const { error: saveError } = await supabase
      .from("profiles")
      .update({
        shelf_visibility_want_to_read: values.want_to_read,
        shelf_visibility_currently_reading: values.currently_reading,
        shelf_visibility_read: values.read,
        shelf_visibility_dnf: values.dnf,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (saveError) {
      setSaving(false);
      setError(saveError.message);
      return;
    }

    const customUpdates = customShelves.map((shelf) => {
      const visibility = customValues[shelf.id] ?? shelf.visibility;
      if (visibility === shelf.visibility) return Promise.resolve({ error: undefined });
      return updateCustomShelfVisibility(shelf.id, visibility);
    });

    const results = await Promise.all(customUpdates);
    const customError = results.find((r) => r.error)?.error;

    setSaving(false);

    if (customError) {
      setError(customError);
      return;
    }

    await refreshCustomShelves();
    toast.success("Saved");
  }

  function handleCustomShelfCreated(shelf: UserShelf) {
    setCustomShelves((prev) => [...prev, shelf]);
    setCustomValues((prev) => ({ ...prev, [shelf.id]: shelf.visibility }));
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-puce-red">Shelf privacy</h2>
          <p className="mt-1 text-sm text-text-muted">
            Choose who can see each shelf on your public profile and library room.
          </p>
        </div>
        <CreateShelfButton
          userId={profile.id}
          onCreated={handleCustomShelfCreated}
          variant="outline"
        />
      </div>

      <ul className="mt-5 space-y-4">
        {getShelvesInOrder().map((shelf) => (
          <li
            key={shelf.status}
            className="flex flex-col gap-2 rounded-lg border border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-text">
                <ShelfTitleRow
                  id={shelf.status}
                  title={shelf.title}
                  size="small"
                  titleClassName="font-medium text-text"
                />
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

        {customShelves.map((shelf) => (
          <li
            key={shelf.id}
            className="flex flex-col gap-2 rounded-lg border border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-text">📚 {shelf.name}</p>
              {shelf.genre ? (
                <p className="text-xs text-text-muted">Genre: {shelf.genre}</p>
              ) : (
                <p className="text-xs text-text-muted">Custom collection</p>
              )}
            </div>
            <select
              value={customValues[shelf.id] ?? shelf.visibility}
              onChange={(e) =>
                setCustomValues((prev) => ({
                  ...prev,
                  [shelf.id]: e.target.value as ShelfVisibility,
                }))
              }
              className={cn(
                "min-h-[44px] rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text",
                "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              )}
              aria-label={`${shelf.name} visibility`}
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

      {customShelves.length === 0 ? (
        <p className="mt-3 text-xs text-text-muted">
          Create a custom shelf above to set its privacy here.
        </p>
      ) : null}

      <p className="mt-3 text-xs text-text-muted">
        Current:{" "}
        {getShelvesInOrder().map((shelf) => (
          <span key={shelf.status}>
            {shelf.title} ({shelfVisibilityLabel(values[shelf.status])}){" "}
          </span>
        ))}
        {customShelves.map((shelf) => (
          <span key={shelf.id}>
            {shelf.name} ({shelfVisibilityLabel(customValues[shelf.id] ?? shelf.visibility)}){" "}
          </span>
        ))}
      </p>

      {error ? (
        <p className="mt-3 text-sm text-rust" role="alert">
          {error}
        </p>
      ) : null}

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
