"use client";

import Link from "next/link";
import { useState } from "react";
import { BookCover } from "@/components/books/BookCover";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { bookDetailsPath } from "@/lib/routes/book";
import { setBookShelfStatus } from "@/lib/actions/book";
import { useToast } from "@/components/ui/Toast";
import type { LibraryBookRow } from "@/lib/services/library";
import { cn } from "@/lib/utils/cn";

type Props = {
  items: LibraryBookRow[];
  onItemsChange?: () => void;
};

export function CurrentlyReadingRow({ items, onItemsChange }: Props) {
  const toast = useToast();
  const [closingId, setClosingId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-text-muted">
        Pick up a book from your{" "}
        <Link href="/search" className="font-medium text-primary hover:underline">
          search
        </Link>{" "}
        or{" "}
        <Link href="/library/want-to-read" className="font-medium text-primary hover:underline">
          want-to-read shelf
        </Link>{" "}
        to start reading.
      </p>
    );
  }

  async function handleClose(bookId: string, title: string) {
    setClosingId(bookId);
    const formData = new FormData();
    formData.set("book_id", bookId);
    formData.set("shelf_status", "want_to_read");

    try {
      const result = await setBookShelfStatus({}, formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result.success ?? `Moved "${title}" to want to read`);
      onItemsChange?.();
    } finally {
      setClosingId(null);
    }
  }

  return (
    <ul className="mx-auto grid max-w-4xl justify-items-center gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((ub) => {
        const book = ub.books;
        const percent = Math.round(Number(ub.progress_percent) || 0);
        const bookId = book?.id;
        const isClosing = closingId === bookId;

        return (
          <li
            key={ub.id}
            className="relative flex w-full max-w-[220px] flex-col items-center rounded-xl border border-border bg-background p-4 text-center shadow-sm transition hover:shadow-md"
          >
            {bookId ? (
              <button
                type="button"
                onClick={() => void handleClose(bookId, book?.title ?? "Book")}
                disabled={isClosing}
                className={cn(
                  "absolute right-2 top-2 inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-text-muted",
                  "hover:bg-surface hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange",
                  "disabled:opacity-50"
                )}
                aria-label={`Remove ${book?.title ?? "book"} from currently reading`}
              >
                ✕
              </button>
            ) : null}

            <BookCover
              title={book?.title ?? "Untitled"}
              author={book?.author}
              coverUrl={book?.cover_url}
              className="mx-auto w-28 shadow-sm"
              sizes="112px"
              bookmarked
            />

            <p className="mt-3 line-clamp-2 w-full px-1 text-sm font-semibold text-text">
              {book?.title ?? "Untitled"}
            </p>

            <p className="mt-2 text-2xl font-bold tabular-nums text-puce-red">{percent}%</p>

            {bookId ? (
              <ButtonLink
                href={bookDetailsPath(bookId)}
                variant="secondary"
                size="sm"
                className="mt-4 w-full"
              >
                Continue reading
              </ButtonLink>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
