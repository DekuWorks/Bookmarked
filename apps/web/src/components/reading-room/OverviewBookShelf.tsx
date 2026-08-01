"use client";

import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { ReadingRoomSection } from "@/components/reading-room/ReadingRoomSection";
import { StarDisplay } from "@/components/reviews/StarDisplay";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { bookDetailsPath } from "@/lib/routes/book";
import type { LibraryBookRow } from "@/lib/services/library";

type Props = {
  title: string;
  shelfIconId?: "read" | "currently_reading" | "want_to_read";
  items: LibraryBookRow[];
  emptyMessage: string;
  emptyAction?: { label: string; href: string };
  viewAllHref: string;
  showFinishedDate?: boolean;
  showFavoriteBadge?: boolean;
};

function formatFinishedDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function OverviewBookShelf({
  title,
  shelfIconId,
  items,
  emptyMessage,
  emptyAction,
  viewAllHref,
  showFinishedDate = false,
  showFavoriteBadge = false,
}: Props) {
  return (
    <ReadingRoomSection
      title={title}
      shelfIconId={shelfIconId}
      action={
        <ButtonLink href={viewAllHref} variant="ghost" size="sm" className="shrink-0">
          View all
        </ButtonLink>
      }
    >
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-text-muted">
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
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((ub) => {
            const book = ub.books;
            const href = book?.id ? bookDetailsPath(book.id) : undefined;
            const finishedLabel = showFinishedDate ? formatFinishedDate(ub.finished_at) : null;

            const inner = (
              <div className="flex gap-3 rounded-xl border border-border bg-background p-3 transition hover:shadow-sm">
                <BookCover
                  title={book?.title ?? "Untitled"}
                  author={book?.author}
                  coverUrl={book?.cover_url}
                  className="h-28 w-20 shrink-0 shadow-sm"
                  sizes="80px"
                  bookmarked
                />
                <div className="min-w-0 flex-1 overflow-hidden text-left">
                  <p className="line-clamp-2 text-sm font-semibold text-text">
                    {book?.title ?? "Untitled"}
                  </p>
                  {book?.author ? (
                    <p className="mt-1 line-clamp-1 text-xs text-text-muted">{book.author}</p>
                  ) : null}
                  {showFavoriteBadge && ub.is_favorite ? (
                    <span
                      className="mt-2 inline-flex items-center justify-center rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-puce-red"
                      aria-label="Favorite"
                    >
                      ★ Favorite
                    </span>
                  ) : null}
                  {ub.rating != null && ub.rating > 0 ? (
                    <div className="mt-2">
                      <StarDisplay rating={ub.rating} showNumeric className="text-sm" />
                    </div>
                  ) : null}
                  {finishedLabel ? (
                    <p className="mt-2 text-xs text-text-muted">Finished {finishedLabel}</p>
                  ) : null}
                </div>
              </div>
            );

            return (
              <li key={ub.id}>
                {href ? (
                  <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange focus-visible:ring-offset-2 rounded-xl">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </ReadingRoomSection>
  );
}
