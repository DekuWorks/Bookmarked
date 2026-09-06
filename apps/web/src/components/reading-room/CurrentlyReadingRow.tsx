"use client";

import { useState } from "react";
import { BookCover } from "@/components/books/BookCover";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { AddBookCoverCard } from "@/components/reading-room/AddBookCoverCard";
import { CurrentlyReadingAddDialog } from "@/components/reading-room/CurrentlyReadingAddDialog";
import { bookDetailsPath } from "@/lib/routes/book";
import { setBookShelfStatus } from "@/lib/actions/book";
import { trackProductEvent } from "@/lib/services/productAnalytics";
import { useToast } from "@/components/ui/Toast";
import type { LibraryBookRow } from "@/lib/services/library";
import { cn } from "@/lib/utils/cn";
import { CURRENTLY_READING_ADD_EVENTS } from "@bookmarked/utils/currentlyReadingAdd";
import {
  CURRENTLY_READING_CARD_SIZE,
  currentlyReadingCardBoxStyle,
} from "@bookmarked/utils/currentlyReadingCard";

type Props = {
  items: LibraryBookRow[];
  onItemsChange?: () => void;
};

export function CurrentlyReadingRow({ items, onItemsChange }: Props) {
  const toast = useToast();
  const [closingId, setClosingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  function openAdd() {
    trackProductEvent(CURRENTLY_READING_ADD_EVENTS.opened);
    setAddOpen(true);
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
    <>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-background px-4 py-10 text-center">
          <p className="text-sm text-text-muted">You aren&apos;t currently reading anything.</p>
          <AddBookCoverCard onClick={openAdd} />
        </div>
      ) : (
        <ul className="mx-auto grid max-w-4xl justify-items-center gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((ub) => {
            const book = ub.books;
            const percent = Math.round(Number(ub.progress_percent) || 0);
            const bookId = book?.id;
            const isClosing = closingId === bookId;

            const cardSize = CURRENTLY_READING_CARD_SIZE.web;
            const cardBox = currentlyReadingCardBoxStyle("web");

            return (
              <li
                key={ub.id}
                className="relative flex shrink-0 flex-col items-center border border-border bg-background text-center shadow-sm transition hover:shadow-md"
                style={{
                  width: cardBox.width,
                  minHeight: cardBox.height,
                  borderRadius: cardBox.borderRadius,
                  padding: cardSize.paddingPx,
                }}
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

                <div
                  className="mx-auto"
                  style={{ width: cardSize.coverWidthPx }}
                >
                  <BookCover
                    title={book?.title ?? "Untitled"}
                    author={book?.author}
                    coverUrl={book?.cover_url}
                    className="shadow-sm"
                    sizes={`${cardSize.coverWidthPx}px`}
                    bookmarked
                    priority
                  />
                </div>

                <p className="mt-3 line-clamp-2 w-full px-1 font-display text-base font-bold leading-snug tracking-tight text-text">
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
          <li className="flex shrink-0 items-stretch justify-center">
            <AddBookCoverCard onClick={openAdd} />
          </li>
        </ul>
      )}

      <CurrentlyReadingAddDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={() => onItemsChange?.()}
      />
    </>
  );
}
