"use client";

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

type Props = {
  sessions: ReadingSession[];
  loading?: boolean;
};

export function ReadingJournalSection({ sessions, loading }: Props) {
  const chronological = [...sessions].reverse();
  const oldestId = chronological[0]?.id;

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
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
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
