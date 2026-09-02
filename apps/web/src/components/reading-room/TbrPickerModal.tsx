"use client";

import { useEffect, useMemo, useState } from "react";
import { BookCover } from "@/components/books/BookCover";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { ShelfBadge } from "@/components/shelves/ShelfBadge";
import { getUserLibraryBooks, type LibraryBookRow } from "@/lib/services/library";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import {
  TBR_PICKER_SEARCH_THRESHOLD,
  filterTbrBooksByQuery,
  selectWantToReadBooks,
} from "@bookmarked/utils/currentlyReadingAdd";
import { CURRENTLY_READING_ADD_COPY } from "@bookmarked/utils/overviewCopy";

type Props = {
  open: boolean;
  movingId: string | null;
  onClose: () => void;
  onSelect: (row: LibraryBookRow) => void;
  onSearchForABook: () => void;
};

export function TbrPickerModal({ open, movingId, onClose, onSelect, onSearchForABook }: Props) {
  const user = useAuthUser();
  const userId = user?.id;
  const [books, setBooks] = useState<LibraryBookRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [reloadId, setReloadId] = useState(0);

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;

    void getUserLibraryBooks(userId)
      .then((rows) => {
        if (cancelled) return;
        setBooks(selectWantToReadBooks(rows));
        setError(null);
        setQuery("");
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Could not load your TBR.");
      });

    return () => {
      cancelled = true;
    };
  }, [open, userId, reloadId]);

  const filtered = useMemo(
    () => (books ? filterTbrBooksByQuery(books, query) : []),
    [books, query]
  );
  const showSearch = (books?.length ?? 0) >= TBR_PICKER_SEARCH_THRESHOLD;

  return (
    <Modal open={open} onClose={onClose} title={CURRENTLY_READING_ADD_COPY.chooseFromTbr}>
      {books === null && !error ? (
        <ul className="space-y-3" aria-busy aria-label="Loading TBR">
          {Array.from({ length: 3 }).map((_, index) => (
            <li key={index} className="flex items-center gap-3">
              <Skeleton className="h-[72px] w-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <div className="space-y-3 text-center">
          <p className="text-sm text-rust">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setError(null);
              setBooks(null);
              setReloadId((id) => id + 1);
            }}
          >
            Retry
          </Button>
        </div>
      ) : null}

      {books && books.length === 0 && !error ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-text-muted">{CURRENTLY_READING_ADD_COPY.tbrEmpty}</p>
          <Button type="button" variant="secondary" size="sm" onClick={onSearchForABook}>
            {CURRENTLY_READING_ADD_COPY.searchForABook}
          </Button>
        </div>
      ) : null}

      {books && books.length > 0 ? (
        <div className="space-y-3">
          {showSearch ? (
            <Input
              label="Filter TBR"
              hideLabel
              placeholder="Filter by title or author"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          ) : null}
          {filtered.length === 0 ? (
            <p className="text-sm text-text-muted">No TBR books match that filter.</p>
          ) : (
            <ul className="space-y-2">
              {filtered.map((row) => {
                const book = row.books;
                const bookId = book?.id;
                const busy = movingId === bookId;
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      disabled={!bookId || Boolean(movingId)}
                      onClick={() => onSelect(row)}
                      className="flex min-h-[44px] w-full items-center gap-3 rounded-xl border border-border bg-background p-2 text-left transition hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange disabled:opacity-60"
                    >
                      <div className="w-12 shrink-0">
                        <BookCover
                          title={book?.title ?? "Untitled"}
                          author={book?.author}
                          coverUrl={book?.cover_url}
                          sizes="48px"
                          bookmarked
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold text-text">
                          {book?.title ?? "Untitled"}
                        </p>
                        {book?.author ? (
                          <p className="mt-0.5 line-clamp-1 text-xs text-text-muted">{book.author}</p>
                        ) : null}
                        <div className="mt-1">
                          <ShelfBadge status="want_to_read" />
                        </div>
                      </div>
                      {busy ? <span className="text-xs text-text-muted">Moving…</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
