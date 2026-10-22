"use client";

import { useId, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { updateReadingSession } from "@/lib/services/readingSessions";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { SessionMoodPicker } from "@/components/books/SessionMoodPicker";
import { sessionMoodsFromRow } from "@bookmarked/utils/sessionMoods";
import {
  BOOK_TRAIL_PREVIEW_LIMIT,
  bookTrailSessionDisplay,
  filterBookTrailSessions,
  fullBookTrailHref,
  initialBookTrailOpen,
  sortBookTrailSessions,
} from "@bookmarked/utils/bookTrail";
import type { ReadingSession } from "@/types";
import { cn } from "@/lib/utils/cn";

function formatSessionDay(session: { created_at: string; session_date?: string | null }): string {
  const day = session.session_date?.slice(0, 10) ?? "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(`${day}T12:00:00`) : new Date(session.created_at);
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

type SessionNoteEditorProps = {
  session: ReadingSession;
  userBookId: string;
  oldest: boolean;
  onSaved: (session: ReadingSession) => void;
};

function SessionNoteEditor({ session, userBookId, oldest, onSaved }: SessionNoteEditorProps) {
  const toast = useToast();
  const noteId = useId();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(session.note ?? "");
  const [moods, setMoods] = useState(sessionMoodsFromRow(session));
  const [saving, setSaving] = useState(false);
  const display = bookTrailSessionDisplay(session, { oldest });
  const sessionKey = `${session.id}:${session.note ?? ""}:${display.moods.join("|")}`;
  const [seenKey, setSeenKey] = useState(sessionKey);
  if (!editing && seenKey !== sessionKey) {
    setSeenKey(sessionKey);
    setDraft(session.note ?? "");
    setMoods(sessionMoodsFromRow(session));
  }

  async function handleSave() {
    setSaving(true);
    const result = await updateReadingSession(session.id, { note: draft, moods, userBookId });
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.session) onSaved(result.session);
    setEditing(false);
    toast.success("Trail entry saved");
  }

  async function handleMoodChange(nextMoods: string[]) {
    setMoods(nextMoods);
    const result = await updateReadingSession(session.id, { moods: nextMoods, userBookId });
    if (result.error) {
      toast.error(result.error);
      setMoods(sessionMoodsFromRow(session));
      return;
    }
    if (result.session) onSaved(result.session);
  }

  return (
    <div className="mt-2 space-y-2">
      {display.note && !editing ? (
        <p className="text-sm italic text-text-muted">&ldquo;{display.note}&rdquo;</p>
      ) : null}
      <SessionMoodPicker values={moods} onChange={(value) => void handleMoodChange(value)} disabled={saving} />
      {editing ? (
        <div className="space-y-2">
          <label htmlFor={noteId} className="text-xs font-medium text-text">
            Session note
          </label>
          <textarea
            id={noteId}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={2}
            maxLength={500}
            aria-label="Session note"
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
                setMoods(sessionMoodsFromRow(session));
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(session.note ?? "");
            setMoods(sessionMoodsFromRow(session));
            setEditing(true);
          }}
          className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
        >
          {display.note ? "Edit note" : "Add note"}
        </button>
      )}
    </div>
  );
}

type ListProps = {
  sessions: ReadingSession[];
  userBookId: string;
  total: number;
  pageStartIndex?: number;
  onSessionUpdate?: (session: ReadingSession) => void;
};

export function BookTrailSessionList({
  sessions,
  userBookId,
  total,
  pageStartIndex = 0,
  onSessionUpdate,
}: ListProps) {
  const visible = sortBookTrailSessions(filterBookTrailSessions(sessions, userBookId));

  if (!visible.length) {
    return <p className="text-sm text-text-muted">No reading sessions yet. Save progress to start your trail.</p>;
  }

  return (
    <ol className="space-y-0">
      {visible.map((session, index) => {
        const oldest = pageStartIndex + index === total - 1 && total > 0;
        const display = bookTrailSessionDisplay(session, { oldest });
        return (
          <li
            key={session.id}
            className="relative border-l-2 border-primary/30 py-3 pl-4 first:pt-0 last:pb-0"
          >
            <span className="absolute -left-[5px] top-4 h-2 w-2 rounded-full bg-royal-orange" />
            <p className="text-sm font-medium text-text" suppressHydrationWarning>
              <time dateTime={session.session_date ?? session.created_at}>{formatSessionDay(session)}</time>
            </p>
            <p className="mt-0.5 text-sm text-text-muted">{display.summary}</p>
            <SessionNoteEditor
              session={session}
              userBookId={userBookId}
              oldest={oldest}
              onSaved={(updated) => onSessionUpdate?.(updated)}
            />
          </li>
        );
      })}
    </ol>
  );
}

type Props = {
  bookId: string;
  userBookId: string;
  sessions: ReadingSession[];
  total: number;
  onSessionUpdate?: (session: ReadingSession) => void;
};

export function ReadingJournalSection({ bookId, userBookId, sessions, total, onSessionUpdate }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trailParam = searchParams.get("trail");
  const [open, setOpen] = useState(() => initialBookTrailOpen(trailParam));
  const [trackedParam, setTrackedParam] = useState(trailParam);
  const [rows, setRows] = useState(sessions);
  const [seenSessions, setSeenSessions] = useState(sessions);

  if (trailParam !== trackedParam) {
    setTrackedParam(trailParam);
    if (initialBookTrailOpen(trailParam)) setOpen(true);
  }
  if (sessions !== seenSessions) {
    setSeenSessions(sessions);
    setRows(sessions);
  }

  const preview = sortBookTrailSessions(filterBookTrailSessions(rows, userBookId)).slice(
    0,
    BOOK_TRAIL_PREVIEW_LIMIT
  );
  const countLabel = total === 1 ? "1 session" : `${total} sessions`;
  const disclosureLabel = total > 0 ? `Trail, ${countLabel}, ${open ? "expanded" : "collapsed"}` : `Trail, ${open ? "expanded" : "collapsed"}`;

  function replaceTrailParam(nextOpen: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextOpen) params.set("trail", "open");
    else params.delete("trail");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    replaceTrailParam(next);
  }

  function openFullTrail() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("trail", "open");
    const qs = params.toString();
    if (typeof window !== "undefined") {
      window.history.replaceState(window.history.state, "", `${pathname}?${qs}`);
    }
    router.push(fullBookTrailHref("web", bookId));
  }

  function handleSaved(updated: ReadingSession) {
    setRows((current) => current.map((session) => (session.id === updated.id ? updated : session)));
    onSessionUpdate?.(updated);
  }

  return (
    <section id="reading-trail" className="surface-card overflow-hidden text-left">
      <h2 className="m-0">
        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-between gap-3 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-royal-orange"
          aria-expanded={open}
          aria-controls="reading-trail-panel"
          aria-label={disclosureLabel}
          onClick={toggle}
        >
          <span className="min-w-0">
            <span className="block text-lg font-semibold text-puce-red">Trail</span>
            {total > 0 ? (
              <span className="mt-1 block text-sm text-text-muted">{countLabel}</span>
            ) : null}
          </span>
          <span
            aria-hidden
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-text-muted motion-safe:transition-transform motion-reduce:transition-none",
              open && "rotate-180"
            )}
          >
            ▾
          </span>
        </button>
      </h2>
      {open ? (
        <div id="reading-trail-panel" role="region" aria-label="Trail" className="border-t border-border/60 px-5 pb-5 pt-4">
          <BookTrailSessionList
            sessions={preview}
            userBookId={userBookId}
            total={total}
            onSessionUpdate={handleSaved}
          />
          {total > BOOK_TRAIL_PREVIEW_LIMIT ? (
            <div className="mt-6 text-center">
              <Button type="button" variant="outline" size="sm" onClick={openFullTrail}>
                View Full Trail · {countLabel}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
