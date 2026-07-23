"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BookCover } from "@/components/books/BookCover";
import { ShelfBadge } from "@/components/shelves/ShelfBadge";
import { Button } from "@/components/ui/Button";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { bookDetailsPath } from "@/lib/routes/book";
import type { MatchingBook, SuggestedShelf, SuggestionMatchingBooks } from "@/lib/services/suggestedShelves";
import { cn } from "@/lib/utils/cn";

type Props = {
  open: boolean;
  shelf: SuggestedShelf | null;
  matching: SuggestionMatchingBooks;
  creating?: boolean;
  onClose: () => void;
  onCreate: () => void;
  onCustomize: () => void;
};

type BookTab = "unread" | "library";

function shelfSubtitle(shelf: SuggestedShelf): string {
  const parts: string[] = [];
  if (shelf.genre) parts.push(shelf.genre);
  else parts.push(shelf.reason);
  return parts.join(" · ");
}

function searchHrefForGenre(genre: string | null): string {
  if (genre?.trim()) {
    return `/search/?q=${encodeURIComponent(genre.trim())}`;
  }
  return "/search";
}

function MatchingBookCard({ book }: { book: MatchingBook }) {
  const href = bookDetailsPath(book.id);

  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 rounded-lg border border-border bg-background p-2 transition hover:bg-primary/5"
      >
        <BookCover
          title={book.title}
          author={book.author}
          coverUrl={book.cover}
          className="h-16 w-11 shrink-0"
          sizes="44px"
          bookmarked
        />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium text-text">{book.title}</p>
          {book.author ? (
            <p className="mt-0.5 line-clamp-1 text-xs text-text-muted">{book.author}</p>
          ) : null}
          <ShelfBadge status={book.shelf_status} className="mt-1.5" />
        </div>
      </Link>
    </li>
  );
}

function MatchingBookList({
  books,
  emptyMessage,
  emptyAction,
}: {
  books: MatchingBook[];
  emptyMessage: string;
  emptyAction?: { label: string; href: string };
}) {
  if (books.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-text-muted">
        {emptyMessage}
        {emptyAction ? (
          <>
            {" "}
            <Link href={emptyAction.href} className="font-medium text-primary hover:underline">
              {emptyAction.label}
            </Link>
          </>
        ) : null}
      </p>
    );
  }

  return (
    <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
      {books.map((book) => (
        <MatchingBookCard key={book.id} book={book} />
      ))}
    </ul>
  );
}

export function SuggestedShelfPreviewBar({
  open,
  shelf,
  matching,
  creating = false,
  onClose,
  onCreate,
  onCustomize,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<BookTab>("unread");
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) {
      setExpanded(false);
      setActiveTab("unread");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !shelf) return null;

  const { matchingBooks, unreadMatches, currentlyReadingMatches } = matching;
  const previewBooks = matchingBooks.slice(0, 8);
  const overflow = matchingBooks.length - previewBooks.length;
  const searchHref = searchHrefForGenre(shelf.genre);
  const genreLabel = shelf.genre?.trim() || "similar";

  const tabBooks = activeTab === "unread" ? unreadMatches : matchingBooks;
  const unreadEmptyMessage =
    matchingBooks.length > 0
      ? "No unread matches in this suggestion — check your full library list."
      : `No matches yet — add ${genreLabel} books from search`;
  const libraryEmptyMessage = `No matches yet — add ${genreLabel} books from search`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-end sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-puce-red/40"
        aria-label="Close preview"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shelf-preview-title"
        className={cn(
          "relative z-10 w-full border border-border bg-surface shadow-xl",
          "rounded-t-2xl sm:max-w-lg sm:rounded-xl",
          "mx-0 max-h-[85vh] overflow-y-auto sm:mx-4"
        )}
      >
        <div className="border-b border-border px-4 py-3 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2
                id="shelf-preview-title"
                className="truncate text-lg font-semibold text-puce-red"
              >
                📚 {shelf.name}
              </h2>
              <p className="mt-0.5 text-sm text-text-muted">{shelfSubtitle(shelf)}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
              aria-label="Close preview"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-5">
          {matchingBooks.length > 0 ? (
            <>
              <p className="mb-3 text-sm text-text-muted">
                {matchingBooks.length} book{matchingBooks.length === 1 ? "" : "s"} from your
                library
                {unreadMatches.length > 0
                  ? ` · ${unreadMatches.length} unread`
                  : null}
              </p>
              <ul className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {previewBooks.map((book) => (
                  <li key={book.id} className="w-14 shrink-0 sm:w-16">
                    <Link href={bookDetailsPath(book.id)} className="block transition hover:opacity-90">
                      <BookCover
                        title={book.title}
                        author={book.author}
                        coverUrl={book.cover}
                        className="w-full"
                        sizes="64px"
                        bookmarked
                        bookmarkBadgeSize="small"
                      />
                    </Link>
                  </li>
                ))}
                {overflow > 0 ? (
                  <li className="flex w-14 shrink-0 items-center justify-center sm:w-16">
                    <span className="rounded-lg border border-dashed border-border bg-background px-2 py-4 text-xs font-medium text-text-muted">
                      +{overflow}
                    </span>
                  </li>
                ) : null}
              </ul>

              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="mt-4 flex min-h-[44px] w-full items-center justify-between rounded-lg border border-border bg-background px-3 text-sm font-medium text-text transition hover:bg-primary/5"
                aria-expanded={expanded}
              >
                <span>
                  {expanded ? "Hide matching books" : "See all matching books"}
                  {!expanded ? ` (${matchingBooks.length})` : ""}
                </span>
                <span aria-hidden="true">{expanded ? "▲" : "▼"}</span>
              </button>

              {expanded ? (
                <div className="mt-3">
                  <div
                    role="tablist"
                    aria-label="Matching book filters"
                    className="mb-3 flex gap-2"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === "unread"}
                      onClick={() => setActiveTab("unread")}
                      className={cn(
                        "min-h-[44px] flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition",
                        activeTab === "unread"
                          ? "border-primary bg-primary/10 text-puce-red"
                          : "border-border bg-background text-text-muted hover:bg-primary/5"
                      )}
                    >
                      Unread ({unreadMatches.length})
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === "library"}
                      onClick={() => setActiveTab("library")}
                      className={cn(
                        "min-h-[44px] flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition",
                        activeTab === "library"
                          ? "border-primary bg-primary/10 text-puce-red"
                          : "border-border bg-background text-text-muted hover:bg-primary/5"
                      )}
                    >
                      In your library ({matchingBooks.length})
                    </button>
                  </div>

                  {activeTab === "unread" && currentlyReadingMatches.length > 0 ? (
                    <p className="mb-2 text-xs text-text-muted">
                      {currentlyReadingMatches.length} currently reading
                    </p>
                  ) : null}

                  <MatchingBookList
                    books={tabBooks}
                    emptyMessage={
                      activeTab === "unread" ? unreadEmptyMessage : libraryEmptyMessage
                    }
                    emptyAction={
                      tabBooks.length === 0
                        ? { label: "Search for books", href: searchHref }
                        : undefined
                    }
                  />
                </div>
              ) : null}
            </>
          ) : (
            <p className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-text-muted">
              No matches yet — add {genreLabel} books from{" "}
              <Link href={searchHref} className="font-medium text-primary hover:underline">
                search
              </Link>
              . You can still create this shelf and add books later.
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border px-4 py-3 sm:px-5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={creating}
            onClick={onClose}
            className="min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={creating}
            onClick={onCustomize}
            className="min-h-[44px]"
          >
            Customize
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={creating}
            onClick={onCreate}
            className="min-h-[44px]"
          >
            Create shelf
          </Button>
        </div>
      </div>
    </div>
  );
}
