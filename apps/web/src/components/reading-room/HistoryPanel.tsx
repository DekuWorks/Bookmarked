"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookMiniGrid } from "@/components/reading-room/BookMiniGrid";
import { HistorySortSelect } from "@/components/reading-room/HistorySortSelect";
import { LoadingState } from "@/components/ui/LoadingState";
import { formatSessionDate } from "@/lib/reading-room/trail";
import type { LibraryBookRow } from "@/lib/services/library";
import type { UserReadingSession } from "@/lib/services/readingSessions";
import { cn } from "@/lib/utils/cn";
import {
  DEFAULT_HISTORY_SORT,
  countFinishedHistoryBooks,
  selectHistoryBooks,
  type HistorySortMode,
} from "@bookmarked/utils/readingRoomHistory";

type Props = {
  books: LibraryBookRow[];
  sessions: UserReadingSession[] | null;
};

export function HistoryPanel({ books, sessions }: Props) {
  const [sort, setSort] = useState<HistorySortMode>(DEFAULT_HISTORY_SORT);

  const finishedBooks = useMemo(
    () => selectHistoryBooks(books, sort),
    [books, sort]
  );
  const totalFinishedBooks = useMemo(() => countFinishedHistoryBooks(books), [books]);

  return (
    <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-puce-red">
          Recently finished books and reading sessions
        </h2>
        <HistorySortSelect value={sort} onChange={setSort} className="sm:min-w-[220px]" />
      </div>

      <div className="mt-6">
        {totalFinishedBooks > finishedBooks.length ? (
          <p className="mb-3 text-sm text-text-muted">
            Showing {finishedBooks.length} of {totalFinishedBooks} finished books for this sort.
          </p>
        ) : null}
        <BookMiniGrid
          items={finishedBooks}
          emptyMessage="Books you finish will appear here."
          emptyAction={{ label: "Browse library", href: "/library/read/" }}
        />
      </div>

      <p className="mt-4 text-sm">
        <Link href="/library/read/" className="font-semibold text-primary hover:underline">
          Browse read shelf ›
        </Link>
      </p>

      {sessions === null ? (
        <LoadingState message="Loading sessions…" />
      ) : sessions.length > 0 ? (
        <div className="mt-8 text-left">
          <h3 className="text-center text-base font-semibold text-puce-red">Recent sessions</h3>
          <ol className="mt-4 max-h-80 space-y-2 overflow-y-auto">
            {sessions.slice(0, 20).map((session) => (
              <li
                key={session.id}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-2 rounded-lg",
                  "border border-border/60 bg-background/40 px-3 py-2 text-sm"
                )}
              >
                <span className="font-medium text-text">
                  {session.bookTitle ?? "Session"}
                </span>
                <span className="text-text-muted">
                  {formatSessionDate(session.created_at)} · {session.pages_read} pages
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
