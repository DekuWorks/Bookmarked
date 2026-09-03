"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NotesBookFilter } from "@/components/notes/NotesBookFilter";
import { NotesSearchResultCard } from "@/components/notes/NotesSearchResultCard";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  listNotedBooksForUser,
  searchNotesWithBooks,
  type ReadingNoteWithBook,
} from "@/lib/services/readingNotes";
import { HOME_NOTES_PREVIEW_LIMIT } from "@bookmarked/utils/noteLocation";
import {
  NOTES_BOOK_FILTER_COPY,
  NOTES_BOOK_QUERY_PARAM,
  matchNotesBookFilter,
  notesEmptyMessage,
  sortNotesForBookFilter,
  type NotesBookFilterOption,
} from "@bookmarked/utils/notesBookFilter";

type Props = {
  userId: string;
};

function notesTabHref(userBookId: string | null): string {
  const params = new URLSearchParams({ tab: "notes" });
  if (userBookId) params.set(NOTES_BOOK_QUERY_PARAM, userBookId);
  return `/reading-room/?${params.toString()}`;
}

export function NotesPanel({ userId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookParam = searchParams.get(NOTES_BOOK_QUERY_PARAM);
  const [options, setOptions] = useState<NotesBookFilterOption[] | null>(null);
  const [notes, setNotes] = useState<ReadingNoteWithBook[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadId, setReloadId] = useState(0);

  const selectedUserBookId = useMemo(
    () => matchNotesBookFilter(bookParam, options ?? []),
    [bookParam, options]
  );

  const requestKey = `${userId}::${bookParam ?? ""}::${reloadId}`;
  const [prevRequestKey, setPrevRequestKey] = useState(requestKey);
  if (requestKey !== prevRequestKey) {
    setPrevRequestKey(requestKey);
    setNotes(null);
    setError(null);
  }

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const booksResult = await listNotedBooksForUser(userId);
      if (cancelled) return;
      if (booksResult.error) {
        setOptions([]);
        setNotes([]);
        setError(booksResult.error);
        return;
      }
      setOptions(booksResult.options);

      const resolved = matchNotesBookFilter(bookParam, booksResult.options);
      const { notes: rows, error: notesError } = await searchNotesWithBooks({
        userId,
        userBookId: resolved ?? undefined,
        limit: resolved ? 100 : HOME_NOTES_PREVIEW_LIMIT,
      });
      if (cancelled) return;
      if (notesError) {
        setNotes([]);
        setError(NOTES_BOOK_FILTER_COPY.error);
        return;
      }
      setNotes(sortNotesForBookFilter(rows, resolved));
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, bookParam, reloadId]);

  function selectBook(userBookId: string | null) {
    router.push(notesTabHref(userBookId));
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-center">
        <Link
          href="/notes/"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-puce-red px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
        >
          Open Full Notes Page
        </Link>
      </div>

      <section className="rounded-2xl border border-border bg-surface/90 p-5 shadow-sm md:p-6">
        <h3 className="text-center text-base font-semibold text-puce-red">
          {selectedUserBookId ? "Notes" : "Recent notes"}
        </h3>
        <p className="mt-1 text-center text-sm text-text-muted">
          {selectedUserBookId
            ? "Every note saved for this book, oldest first."
            : "Your five most recent notes."}
        </p>

        <div className="mx-auto mt-4 max-w-xl">
          <NotesBookFilter
            options={options ?? []}
            selectedUserBookId={selectedUserBookId}
            onSelect={selectBook}
          />
        </div>

        {notes === null || options === null ? (
          <LoadingState message="Loading notes…" />
        ) : error ? (
          <div className="mt-4 space-y-3 text-center" role="alert">
            <p className="text-sm text-text-muted">{NOTES_BOOK_FILTER_COPY.error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReloadId((id) => id + 1)}
            >
              {NOTES_BOOK_FILTER_COPY.retry}
            </Button>
          </div>
        ) : notes.length === 0 ? (
          <p className="mt-4 text-center text-sm text-text-muted">
            {notesEmptyMessage(selectedUserBookId)}
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {notes.map((note) => (
              <NotesSearchResultCard key={note.id} note={note} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
