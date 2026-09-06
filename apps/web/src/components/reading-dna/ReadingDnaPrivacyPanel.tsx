"use client";

import { useState } from "react";
import type { ReadingDnaPrivacyState } from "@bookmarked/utils/readingDnaPrivacy";
import { Button } from "@/components/ui/Button";

type Props = {
  privacy: ReadingDnaPrivacyState;
  onSave: (next: ReadingDnaPrivacyState) => Promise<{ ok: true } | { ok: false; error: string }>;
};

export function ReadingDnaPrivacyPanel({ privacy, onSave }: Props) {
  const [state, setState] = useState(privacy);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <section className="rounded-2xl border border-border bg-background/70 p-4 text-left">
      <h3 className="font-display text-lg text-puce-red dark:text-primary">DNA visibility</h3>
      <p className="mt-1 text-xs text-text-muted">
        Private DNA never appears on your public profile, Match, or Reader Map. Home membership is
        not consent.
      </p>
      <label className="mt-3 block text-sm">
        Who can see your Top traits
        <select
          className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2"
          value={state.visibility}
          onChange={(event) =>
            setState((current) => ({
              ...current,
              visibility: event.target.value as ReadingDnaPrivacyState["visibility"],
            }))
          }
        >
          <option value="followers">Followers</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
      </label>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={state.publicTopTraitsApproved}
          onChange={(event) =>
            setState((current) => ({ ...current, publicTopTraitsApproved: event.target.checked }))
          }
        />
        Approve public Top 3 (still requires Public visibility)
      </label>
      <label className="mt-2 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={state.sharePersonalityOnReaderMap}
          onChange={(event) =>
            setState((current) => ({
              ...current,
              sharePersonalityOnReaderMap: event.target.checked,
            }))
          }
        />
        Share personality on Reader Map (separate consent)
      </label>
      <label className="mt-2 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={state.matchEnabled !== false}
          onChange={(event) =>
            setState((current) => ({
              ...current,
              matchEnabled: event.target.checked ? null : false,
            }))
          }
        />
        Allow DNA Match (defaults to following visibility)
      </label>
      <Button
        size="sm"
        className="mt-3"
        disabled={saving}
        onClick={() => {
          setSaving(true);
          void onSave(state)
            .then((result) => {
              setMessage(result.ok ? "Saved." : result.error);
            })
            .finally(() => setSaving(false));
        }}
      >
        Save DNA privacy
      </Button>
      {message ? <p className="mt-2 text-xs text-text-muted">{message}</p> : null}
    </section>
  );
}
