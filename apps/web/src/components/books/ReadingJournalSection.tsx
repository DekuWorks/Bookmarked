"use client";

import { useState } from "react";
import { updateReadingSession } from "@/lib/services/readingSessions";
import { Button } from "@/components/ui/Button";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { useToast } from "@/components/ui/Toast";
import { SessionMoodPicker, SessionMoodChip } from "@/components/books/SessionMoodPicker";
import type { ReviewFeeling } from "@/lib/constants/reviewFeelings";
import type { ReadingSession } from "@/types";

export const READING_JOURNAL_PREVIEW_LIMIT = 5;

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
  const [mood, setMood] = useState(session.mood ?? null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await updateReadingSession(session.id, { note: draft, mood });
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.session) onSaved(result.session);
    setEditing(false);
    toast.success("Trail entry saved");
  }

  async function handleMoodChange(nextMood: ReviewFeeling | null) {
    setMood(nextMood);
    const result = await updateReadingSession(session.id, { mood: nextMood });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    if (result.session) onSaved(result.session);
  }

  if (!editing && !session.note && !session.mood) {
    return (
      <div className="mt-2 space-y-2">
        <SessionMoodPicker value={mood} onChange={(value) => void handleMoodChange(value)} />
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs font-medium text-primary hover:underline"
        >
          Add note
        </button>
      </div>
    );
  }

  if (!editing) {
    return (
      <div className="mt-1 space-y-2">
        {session.mood ? <SessionMoodChip mood={session.mood} /> : null}
        {session.note ? (
          <p className="text-sm italic text-text-muted">&ldquo;{session.note}&rdquo;</p>
        ) : null}
        <SessionMoodPicker value={mood} onChange={(value) => void handleMoodChange(value)} />
        <button
          type="button"
          onClick={() => {
            setDraft(session.note ?? "");
            setMood(session.mood ?? null);
            setEditing(true);
          }}
          className="text-xs font-medium text-primary hover:underline"
        >
          Edit note
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <SessionMoodPicker value={mood} onChange={setMood} disabled={saving} />
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
            setMood(session.mood ?? null);
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
  const [expanded, setExpanded] = useState(false);
  const chronological = [...sessions].reverse();
  const oldestId = chronological[0]?.id;
  const hasMoreSessions = sessions.length > READING_JOURNAL_PREVIEW_LIMIT;
  const visibleSessions = expanded
    ? sessions
    : sessions.slice(0, READING_JOURNAL_PREVIEW_LIMIT);

  const badge = loading
    ? undefined
    : sessions.length === 0
      ? "Empty"
      : `${sessions.length} ${sessions.length === 1 ? "entry" : "entries"}`;

  return (
    <CollapsibleSection
      id="reading-trail"
      title="Reading trail"
      description="Your reading history for this book — newest first."
      badge={badge}
    >
      {loading ? (
        <p className="text-sm text-text-muted">Loading trail…</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-text-muted">
          No reading sessions yet. Save progress to start your trail.
        </p>
      ) : (
        <>
          <ol className="space-y-0">
            {visibleSessions.map((session) => (
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
          {hasMoreSessions ? (
            <div className="mt-6 text-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-expanded={expanded}
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? "Show less" : "View full reading trail"}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </CollapsibleSection>
  );
}
