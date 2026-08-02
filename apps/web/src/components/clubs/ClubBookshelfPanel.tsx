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
import type { BookClubBookCategory, BookClubMemberRole, BookClubShelfBook } from "@/types";
import type { BookSearchResult } from "@/lib/services/feedSearch";
import { cn } from "@/lib/utils/cn";

type Props = {
  clubId: string;
  viewerId: string;
  viewerRole: BookClubMemberRole | null;
  onChanged?: () => void;
};

const CATEGORIES: Array<{ id: BookClubBookCategory; label: string }> = [
  { id: "current_read", label: "Current read" },
  { id: "upcoming", label: "Upcoming" },
  { id: "previous", label: "Previous" },
  { id: "suggested", label: "Suggested" },
  { id: "optional", label: "Optional" },
];

export function ClubBookshelfPanel({ clubId, viewerId, viewerRole, onChanged }: Props) {
  const toast = useToast();
  const canManage = canManageBookshelf(viewerRole);
  const [books, setBooks] = useState<BookClubShelfBook[] | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addCategory, setAddCategory] = useState<BookClubBookCategory>("suggested");
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

  const grouped = useMemo(() => {
    const map = new Map<BookClubBookCategory, BookClubShelfBook[]>();
    for (const category of CATEGORIES) map.set(category.id, []);
    for (const book of books ?? []) {
      const list = map.get(book.category) ?? [];
      list.push(book);
      map.set(book.category, list);
    }
    return map;
  }, [books]);

  async function handleAdd(book: BookSearchResult) {
    const result = await addClubBook(clubId, book.id, addCategory);
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
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={addCategory}
              onChange={(e) => setAddCategory(e.target.value as BookClubBookCategory)}
              aria-label="Category for new book"
              className="rounded-lg border border-border bg-surface px-2 py-2 text-sm text-text"
            >
              {CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
            <Button type="button" variant="primary" size="sm" onClick={() => setPickerOpen(true)}>
              Add book
            </Button>
          </div>
        ) : null}
      </div>

      {books.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background px-6 py-10 text-center">
          <p className="font-medium text-puce-red">Shelf is empty</p>
          <p className="mt-2 text-sm text-text-muted">
            {canManage
              ? "Add books to current, upcoming, previous, suggested, or optional."
              : "Hosts haven’t added books to this club shelf yet."}
          </p>
        </div>
      ) : (
        CATEGORIES.map((category) => {
          const items = grouped.get(category.id) ?? [];
          if (!items.length) return null;
          return (
            <div key={category.id}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
                {category.label}
              </h3>
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {items.map((shelf) => {
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
                          className="h-36 w-full"
                          bookmarked
                        />
                        <p className="mt-2 truncate text-sm font-medium text-puce-red">
                          {book.title}
                        </p>
                        {book.author ? (
                          <p className="truncate text-xs text-text-muted">{book.author}</p>
                        ) : null}
                      </Link>

                      {canManage ? (
                        <div className="mt-3 space-y-2 border-t border-border pt-2">
                          <label className="block text-xs text-text-muted">
                            Category
                            <select
                              value={shelf.category}
                              disabled={pendingId === shelf.id}
                              onChange={(e) =>
                                void handleCategory(
                                  shelf.id,
                                  e.target.value as BookClubBookCategory
                                )
                              }
                              className={cn(
                                "mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-text"
                              )}
                            >
                              {CATEGORIES.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <div className="flex flex-wrap gap-2">
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
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })
      )}

      <BookPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        viewerId={viewerId}
        title="Add to club bookshelf"
        onSelect={(book) => void handleAdd(book)}
      />
    </section>
  );
}
