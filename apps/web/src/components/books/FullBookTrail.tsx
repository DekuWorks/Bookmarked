"use client";

import { useEffect, useState } from "react";
import { BookTrailSessionList } from "@/components/books/ReadingJournalSection";
import { BackNav } from "@/components/ui/BackNav";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { getBookTrailPage } from "@/lib/services/readingSessions";
import { BOOK_TRAIL_PAGE_SIZE, fullTrailBackTarget } from "@bookmarked/utils/bookTrail";
import type { ReadingSession } from "@/types";

type Props = {
  bookId: string;
};

export function FullBookTrail({ bookId }: Props) {
  const user = useAuthUser();
  const back = fullTrailBackTarget("web", bookId);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState<string | null>(null);
  const [userBookId, setUserBookId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [total, setTotal] = useState(0);
  const [overrides, setOverrides] = useState<Record<string, ReadingSession>>({});

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    void getBookTrailPage(user.id, bookId, page).then((result) => {
      if (cancelled) return;
      setTitle(result.title);
      setUserBookId(result.userBookId);
      setSessions(result.sessions);
      setTotal(result.total);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [bookId, page, user?.id]);

  const rows = sessions.map((session) => overrides[session.id] ?? session);
  const totalPages = Math.max(1, Math.ceil(total / BOOK_TRAIL_PAGE_SIZE));
  const start = total === 0 ? 0 : (page - 1) * BOOK_TRAIL_PAGE_SIZE + 1;
  const end = Math.min(page * BOOK_TRAIL_PAGE_SIZE, total);

  if (user === undefined) {
    return <LoadingState message="Loading trail…" />;
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <BackNav label="book" fallbackHref={back.href} href={back.href} />
        <p className="text-text-muted">Sign in to view this trail.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 text-left">
      <BackNav label={title ?? "book"} fallbackHref={back.href} />
      <header>
        <h1 className="font-display text-2xl font-bold text-puce-red">Trail</h1>
        {title ? <p className="mt-1 text-sm text-text-muted">{title}</p> : null}
        {total > 0 ? (
          <p className="mt-2 text-sm text-text-muted">
            Showing {start}–{end} of {total} {total === 1 ? "session" : "sessions"}
          </p>
        ) : null}
      </header>
      {loading ? <LoadingState message="Loading trail…" /> : null}
      {userBookId ? (
        <BookTrailSessionList
          sessions={rows}
          userBookId={userBookId}
          total={total}
          pageStartIndex={(page - 1) * BOOK_TRAIL_PAGE_SIZE}
          onSessionUpdate={(updated) => setOverrides((current) => ({ ...current, [updated.id]: updated }))}
        />
      ) : !loading ? (
        <p className="text-sm text-text-muted">Add this book to a shelf to keep a trail.</p>
      ) : null}
      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-medium text-text disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </button>
          <p className="text-sm text-text-muted">
            Page {page} of {totalPages}
          </p>
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-medium text-text disabled:opacity-40"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
