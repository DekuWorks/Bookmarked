"use client";

import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { readerProfilePath } from "@/lib/routes/reader";
import { bookDetailsPath } from "@/lib/routes/book";
import type { FeedItem } from "@/lib/services/socialFeed";

type Props = {
  item: FeedItem;
};

function readerLabel(item: FeedItem): string {
  return item.profiles?.display_name?.trim() || item.profiles?.username?.trim() || "Reader";
}

function readerHref(item: FeedItem): string | null {
  const username = item.profiles?.username?.trim();
  return username ? readerProfilePath(username) : null;
}

export function FeedCard({ item }: Props) {
  const profileHref = readerHref(item);
  const title =
    typeof item.metadata_json?.title === "string"
      ? item.metadata_json.title
      : typeof item.metadata_json?.book_title === "string"
        ? item.metadata_json.book_title
        : "Book";

  return (
    <article className="flex gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm">
      {item.bookId ? (
        <Link
          href={bookDetailsPath(item.bookId)}
          className="relative h-24 w-16 shrink-0 overflow-hidden rounded-md shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
        >
          <BookCover title={title} coverUrl={item.coverUrl} className="h-full w-full" />
        </Link>
      ) : (
        <div
          className="flex h-24 w-16 shrink-0 items-center justify-center rounded-md bg-primary/15 text-2xl"
          aria-hidden
        >
          📚
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm text-text">
          {profileHref ? (
            <Link
              href={profileHref}
              className="font-semibold text-puce-red hover:underline"
            >
              {readerLabel(item)}
            </Link>
          ) : (
            <span className="font-semibold text-puce-red">{readerLabel(item)}</span>
          )}{" "}
          <span>{item.actionMessage}</span>
        </p>
        <p className="mt-1 text-xs text-text-muted">
          <time suppressHydrationWarning dateTime={item.created_at}>
            {new Date(item.created_at).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </time>
        </p>
      </div>
    </article>
  );
}
