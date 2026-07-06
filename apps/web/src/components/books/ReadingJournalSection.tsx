"use client";

import { useState } from "react";
import { updateReadingSessionNote } from "@/lib/services/readingSessions";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { ReadingSession } from "@/types";

function formatSessionDay(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sessionDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - sessionDay.getTime()) / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function sessionLabel(session: ReadingSession, isOldest: boolean): string {
  const { page_start, page_end, pages_read, percent_complete } = session;

  if (isOldest && page_start === 0 && page_end > 0) {
    return `Started reading — page ${page_end} (${Math.round(percent_complete)}%)`;
  }

  if (page_end >= page_start && pages_read > 0) {
    if (page_start === page_end) {
      return `Read page ${page_end} (${Math.round(percent_complete)}%)`;
    }
    return `Read pages ${page_start} → ${page_end} (${pages_read} pages, ${Math.round(percent_complete)}%)`;
  }

  if (percent_complete >= 100) {
    return "Finished reading";
  }

  return `Progress updated — ${Math.round(percent_complete)}% complete`;
}

type SessionNoteEditorProps = {
  session: ReadingSession;
  onSaved: (session: ReadingSession) => void;
};

function SessionNoteEditor({ session, onSaved }: SessionNoteEditorProps) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(session.note ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await updateReadingSessionNote(session.id, draft);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.session) onSaved(result.session);
    setEditing(false);
    toast.success("Note saved");
  }

  if (!editing && !session.note) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-1 text-xs font-medium text-primary hover:underline"
      >
        Add note
      </button>
    );
  }

  if (!editing) {
    return (
      <div className="mt-1">
        <p className="text-sm italic text-text-muted">&ldquo;{session.note}&rdquo;</p>
        <button
          type="button"
          onClick={() => {
            setDraft(session.note ?? "");
            setEditing(true);
          }}
          className="mt-1 text-xs font-medium text-primary hover:underline"
        >
          Edit note
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder="Thoughts from this reading session…"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
      />
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setDraft(session.note ?? "");
            setEditing(false);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

type Props = {
  sessions: ReadingSession[];
  loading?: boolean;
  onSessionUpdate?: (session: ReadingSession) => void;
};

export function ReadingJournalSection({ sessions, loading, onSessionUpdate }: Props) {
  const chronological = [...sessions].reverse();
  const oldestId = chronological[0]?.id;

  return (
    <section id="reading-journal" className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold text-puce-red">Reading journal</h2>
      <p className="mt-1 text-sm text-text-muted">
        Your reading history for this book — newest first.
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-text-muted">Loading journal…</p>
      ) : sessions.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">
          No reading sessions yet. Save progress to start your journal.
        </p>
      ) : (
        <ol className="mt-4 space-y-0">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="relative border-l-2 border-primary/30 py-3 pl-4 first:pt-0 last:pb-0"
            >
              <span className="absolute -left-[5px] top-4 h-2 w-2 rounded-full bg-royal-orange" />
              <p className="text-sm font-medium text-text" suppressHydrationWarning>
                {formatSessionDay(session.created_at)}
              </p>
              <p className="mt-0.5 text-sm text-text-muted">
                {sessionLabel(session, session.id === oldestId)}
              </p>
              <SessionNoteEditor
                session={session}
                onSaved={(updated) => onSessionUpdate?.(updated)}
              />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
