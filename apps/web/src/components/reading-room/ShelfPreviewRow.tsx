"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { bookDetailsPath } from "@/lib/routes/book";
import type { LibraryBookRow } from "@/lib/services/library";
import { bookCountLabel } from "@bookmarked/utils/overviewShelfPreview";
import {
  READING_ROOM_MOTION,
  shelfEnterIds,
  shelfExitIds,
} from "@bookmarked/utils/readingRoomMotion";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

type Props = {
  title: string;
  count: number;
  items: LibraryBookRow[];
};

function coverLink(item: LibraryBookRow, className: string) {
  const book = item.books;
  const bookTitle = book?.title ?? "Untitled";
  if (!book?.id) return null;
  return (
    <Link
      key={item.id}
      href={bookDetailsPath(book.id, { origin: "reading_room_overview" })}
      title={`${bookTitle}${book.author ? `, ${book.author}` : ""}`}
      className={className}
    >
      <span className="shelf-preview-tip">
        <span className="block font-semibold text-puce-red">{bookTitle}</span>
        {book.author ? <span className="block text-text-muted">{book.author}</span> : null}
      </span>
      <span className="block w-[64%] max-w-9 md:max-w-12">
        <BookCover
          title={bookTitle}
          author={book.author}
          coverUrl={book.cover_url}
          alt={`${bookTitle} cover`}
          objectFit="contain"
          objectPosition="bottom"
          sizes="72px"
          bookmarked
          bookmarkBadgeSize="small"
        />
      </span>
    </Link>
  );
}

const frameClass =
  "shelf-preview-book relative flex aspect-square w-14 max-w-14 min-w-0 flex-1 basis-14 items-end justify-center self-end focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange md:w-[4.5rem] md:max-w-[4.5rem] md:basis-[4.5rem]";

export function ShelfPreviewRow({ title, count, items }: Props) {
  const reducedMotion = usePrefersReducedMotion();
  const previousIds = useRef<string[] | null>(null);
  const cache = useRef(new Map<string, LibraryBookRow>());
  const [entering, setEntering] = useState<string[]>([]);
  const [exiting, setExiting] = useState<LibraryBookRow[]>([]);
  const ids = items.map((item) => item.id).join("|");

  useLayoutEffect(() => {
    const nextIds = ids ? ids.split("|") : [];
    const previous = previousIds.current;
    const enter = shelfEnterIds(previous, nextIds);
    const leave = shelfExitIds(previous, nextIds);
    previousIds.current = nextIds;
    for (const item of items) cache.current.set(item.id, item);
    if (previous == null || reducedMotion || (enter.length === 0 && leave.length === 0)) return;
    setEntering(enter);
    setExiting(
      leave
        .map((id) => cache.current.get(id))
        .filter((item): item is LibraryBookRow => Boolean(item))
    );
    const timer = window.setTimeout(() => {
      setEntering([]);
      setExiting([]);
    }, READING_ROOM_MOTION.shelfPlaceMs);
    return () => window.clearTimeout(timer);
  }, [ids, items, reducedMotion]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3 md:gap-5">
      <div className="w-full shrink-0 sm:w-24 sm:pb-3 md:w-28">
        <p className="font-semibold text-puce-red">{title}</p>
        <p className="text-sm text-text-muted">{bookCountLabel(count)}</p>
      </div>
      <div className="min-w-0 flex-1">
        <div className="bookshelf-back flex min-h-16 items-end gap-2 overflow-x-auto px-2 pb-1 pt-3">
          {items.map((item) =>
            coverLink(
              item,
              `${frameClass}${entering.includes(item.id) ? " shelf-cover-in" : ""}`
            )
          )}
          {exiting.map((item) =>
            coverLink(item, `${frameClass} shelf-cover-out`)
          )}
          {count === 0 && exiting.length === 0 ? (
            <p className="pb-2 text-sm text-text-muted">No books on this shelf yet.</p>
          ) : null}
        </div>
        <div className="bookshelf-board h-3 rounded-b-sm" aria-hidden />
      </div>
    </div>
  );
}
