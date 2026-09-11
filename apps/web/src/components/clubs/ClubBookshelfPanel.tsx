"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { Button } from "@/components/ui/Button";
import { BookPickerModal } from "@/components/clubs/BookPickerModal";
import { LoadingState } from "@/components/ui/LoadingState";
import { useToast } from "@/components/ui/Toast";
import {
  addClubBook,
  listClubBooks,
  removeClubBook,
  setClubBookCategory,
  setCurrentRead,
} from "@/lib/services/bookClubs";
import { bookDetailsPath } from "@/lib/routes/book";
import { canManageBookshelf } from "@bookmarked/utils/clubPermissions";
import {
  CLUB_BOOKSHELF_CATEGORIES,
  clubBookshelfEmptyMessage,
  filterClubShelfByCategory,
} from "@bookmarked/utils/clubBookshelf";
import type { BookClubBookCategory, BookClubMemberRole, BookClubShelfBook } from "@/types";
import type { BookSearchResult } from "@/lib/services/feedSearch";
import { cn } from "@/lib/utils/cn";

type Props = {
  clubId: string;
  viewerId: string;
  viewerRole: BookClubMemberRole | null;
  onChanged?: () => void;
};

export function ClubBookshelfPanel({ clubId, viewerId, viewerRole, onChanged }: Props) {
  const toast = useToast();
  const canManage = canManageBookshelf(viewerRole);
  const [books, setBooks] = useState<BookClubShelfBook[] | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [filter, setFilter] = useState<BookClubBookCategory>("current_read");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const rows = await listClubBooks(clubId);
    setBooks(rows);
  }, [clubId]);

  useEffect(() => {
    void load().catch((err) => {
      console.error("[club-bookshelf] load failed:", err);
      setBooks([]);
    });
  }, [load]);

  const filtered = useMemo(
    () => filterClubShelfByCategory(books ?? [], filter),
    [books, filter]
  );

  const activeLabel =
    CLUB_BOOKSHELF_CATEGORIES.find((row) => row.id === filter)?.label ?? filter;

  async function handleAdd(book: BookSearchResult) {
    const result = await addClubBook(clubId, book.id, filter);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Book added to club shelf.");
    setPickerOpen(false);
    await load();
    onChanged?.();
  }

  async function handleRemove(shelfBookId: string) {
    setPendingId(shelfBookId);
    const result = await removeClubBook(shelfBookId);
    setPendingId(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Removed from club shelf.");
    await load();
    onChanged?.();
  }

  async function handleCategory(shelfBookId: string, category: BookClubBookCategory) {
    setPendingId(shelfBookId);
    const result = await setClubBookCategory(shelfBookId, category);
    setPendingId(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    if (category === "current_read") {
      const shelf = books?.find((item) => item.id === shelfBookId);
      if (shelf) {
        const currentResult = await setCurrentRead(clubId, { bookId: shelf.book_id });
        if (currentResult.error) toast.error(currentResult.error);
        else toast.success("Set as current read.");
      }
    } else {
      toast.success("Category updated.");
    }
    await load();
    onChanged?.();
  }

  async function handleSetCurrent(shelf: BookClubShelfBook) {
    setPendingId(shelf.id);
    const result = await setCurrentRead(clubId, { bookId: shelf.book_id });
    if (!result.error) {
      await setClubBookCategory(shelf.id, "current_read");
    }
    setPendingId(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Current read updated.");
    setFilter("current_read");
    await load();
    onChanged?.();
  }

  if (books === null) {
    return <LoadingState message="Loading bookshelf…" />;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-puce-red">Club bookshelf</h2>
          <p className="mt-1 text-sm text-text-muted">
            Curated club reads — separate from your personal library.
          </p>
        </div>
        {canManage ? (
          <Button type="button" variant="primary" size="sm" onClick={() => setPickerOpen(true)}>
            Add book
          </Button>
        ) : null}
      </div>

      <div
        className="flex gap-1 overflow-x-auto"
        role="group"
        aria-label="Bookshelf category filters"
      >
        {CLUB_BOOKSHELF_CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setFilter(category.id)}
            aria-pressed={filter === category.id}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium",
              filter === category.id
                ? "bg-puce-red text-white"
                : "bg-surface text-text-muted hover:text-primary"
            )}
          >
            {category.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background px-6 py-10 text-center">
          <p className="font-medium text-puce-red">{activeLabel}</p>
          <p className="mt-2 text-sm text-text-muted">{clubBookshelfEmptyMessage(filter)}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {filtered.map((shelf) => {
            const book = shelf.book;
            if (!book) return null;
            return (
              <li
                key={shelf.id}
                className="rounded-xl border border-border bg-surface p-3 shadow-sm"
              >
                <Link
                  href={bookDetailsPath(book.id)}
                  className="block rounded-lg hover:opacity-90"
                >
                  <BookCover
                    title={book.title}
                    author={book.author}
                    coverUrl={book.cover_url}
                    className="mx-auto aspect-[2/3] w-full max-w-[140px]"
                    bookmarked
                  />
                  <p className="mt-2 line-clamp-2 text-sm font-medium text-puce-red">
                    {book.title}
                  </p>
                  {book.author ? (
                    <p className="line-clamp-1 text-xs text-text-muted">{book.author}</p>
                  ) : null}
                </Link>
                {canManage ? (
                  <div className="mt-2 space-y-1">
                    <select
                      value={shelf.category}
                      disabled={pendingId === shelf.id}
                      aria-label={`Category for ${book.title}`}
                      onChange={(e) =>
                        void handleCategory(shelf.id, e.target.value as BookClubBookCategory)
                      }
                      className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                    >
                      {CLUB_BOOKSHELF_CATEGORIES.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    {shelf.category !== "current_read" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        loading={pendingId === shelf.id}
                        onClick={() => void handleSetCurrent(shelf)}
                      >
                        Set current
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      loading={pendingId === shelf.id}
                      onClick={() => void handleRemove(shelf.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <BookPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        viewerId={viewerId}
        onSelect={(book) => void handleAdd(book)}
        title="Add book to club shelf"
      />
    </section>
  );
}
