"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookMiniGrid } from "@/components/reading-room/BookMiniGrid";
import { HistorySortSelect } from "@/components/reading-room/HistorySortSelect";
import { BookListPagination } from "@/components/reading-room/BookListPagination";
import { LoadingState } from "@/components/ui/LoadingState";
import { formatSessionDate } from "@/lib/reading-room/trail";
import { formatHistorySessionDetail } from "@bookmarked/utils/listeningTime";
import type { LibraryBookRow } from "@/lib/services/library";
import type { UserReadingSession } from "@/lib/services/readingSessions";
import { cn } from "@/lib/utils/cn";
import {
  DEFAULT_HISTORY_SORT,
  HISTORY_PAGE_SIZE,
  HISTORY_PANEL_COPY,
  filterFinishedHistoryBooks,
  sortHistoryBooks,
  type HistorySortMode,
} from "@bookmarked/utils/readingRoomHistory";
import { withOriginQuery } from "@bookmarked/utils/navigationOrigin";
import { paginateItems } from "@bookmarked/utils/pagination";

type Props = {
  books: LibraryBookRow[];
  sessions: UserReadingSession[] | null;
};

export function HistoryPanel({ books, sessions }: Props) {
  const [sort, setSort] = useState<HistorySortMode>(DEFAULT_HISTORY_SORT);
  const [page, setPage] = useState(1);

  const sortedFinishedBooks = useMemo(
    () => sortHistoryBooks(filterFinishedHistoryBooks(books), sort),
    [books, sort]
  );
  // Reset to page 1 whenever the sort changes (adjust state during render, per
  // https://react.dev/learn/you-might-not-need-an-effect, instead of a setState-in-effect).
  const [prevSort, setPrevSort] = useState(sort);
  if (sort !== prevSort) {
    setPrevSort(sort);
    setPage(1);
  }

  const finishedBooksPage = useMemo(
    () => paginateItems(sortedFinishedBooks, page, HISTORY_PAGE_SIZE),
    [sortedFinishedBooks, page]
  );

  return (
    <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-puce-red">{HISTORY_PANEL_COPY.title}</h2>
        <HistorySortSelect value={sort} onChange={setSort} className="sm:min-w-[220px]" />
      </div>

      <div className="mt-6">
        <BookMiniGrid
          items={finishedBooksPage.pageItems}
          emptyMessage="Books you finish will appear here."
          emptyAction={{
            label: "Browse Library",
            href: withOriginQuery("/library/read/", { origin: "home_history" }),
          }}
        />
        <BookListPagination
          page={finishedBooksPage.page}
          totalPages={finishedBooksPage.totalPages}
          total={finishedBooksPage.total}
          pageSize={finishedBooksPage.pageSize}
          onPageChange={setPage}
          label="finished books"
        />
      </div>

      <p className="mt-4 text-sm">
        <Link
          href={withOriginQuery("/library/read/", { origin: "home_history" })}
          className="font-semibold text-primary hover:underline"
        >
          {HISTORY_PANEL_COPY.browseReadShelf} ›
        </Link>
      </p>

      {sessions === null ? (
        <LoadingState message="Loading sessions…" />
      ) : sessions.length > 0 ? (
        <div className="mt-8 text-left">
          <h3 className="text-center text-base font-semibold text-puce-red">
            {HISTORY_PANEL_COPY.recentSessions}
          </h3>
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
                  {formatSessionDate(session.created_at)} · {formatHistorySessionDetail(session)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
