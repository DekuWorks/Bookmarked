"use client";

import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { CopyLinkButton } from "@/components/ui/CopyLinkButton";
import { feedItemHref } from "@/lib/routes/activity";
import { authorPagePath } from "@/lib/routes/author";
import { readerProfilePath } from "@/lib/routes/reader";
import { bookDetailsPath } from "@/lib/routes/book";
import { isFeedEligibleEvent } from "@/lib/services/activity";
import type { FeedItem } from "@/lib/services/socialFeed";
import { usePreferredLocale } from "@/lib/hooks/usePreferredLocale";
import { formatFeedTimestamp } from "@/lib/utils/locale";

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
  const locale = usePreferredLocale();
  const profileHref = readerHref(item);
  const activityHref = feedItemHref(item);
  const showBookCover =
    isFeedEligibleEvent(item.event_type) || Boolean(item.bookId || item.coverUrl);
  const isFinishedBookEvent =
    item.event_type === "book_finished" || item.event_type === "reading_finished";
  const showBookmarkBadge = Boolean(item.bookId) || isFinishedBookEvent;

  const cover = (
    <BookCover
      title={item.bookTitle}
      coverUrl={item.coverUrl}
      className="h-full w-full"
      bookmarked={showBookmarkBadge}
      bookmarkBadgeSize="sm"
    />
  );

  return (
    <article className="flex gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md">
      {showBookCover ? (
        item.bookId ? (
          <Link
            href={activityHref}
            className="relative h-24 w-16 shrink-0 overflow-hidden rounded-md shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
          >
            {cover}
          </Link>
        ) : (
          <Link
            href={activityHref}
            className="relative flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary/15 text-2xl shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
          >
            📚
          </Link>
        )
      ) : (
        <Link
          href={activityHref}
          className="flex h-24 w-16 shrink-0 items-center justify-center rounded-md bg-primary/15 text-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
          aria-hidden
        >
          📚
        </Link>
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
          <Link href={activityHref} className="hover:text-primary hover:underline">
            {item.actionMessage}
          </Link>
        </p>
        <p className="mt-1 text-xs text-text-muted">
          <time suppressHydrationWarning dateTime={item.created_at}>
            {formatFeedTimestamp(item.created_at, locale)}
          </time>
        </p>
        {item.bookAuthor ? (
          <p className="mt-1 text-sm text-text-muted">
            <Link href={authorPagePath(item.bookAuthor)} className="hover:text-primary hover:underline">
              {item.bookAuthor}
            </Link>
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Link
            href={activityHref}
            className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
          >
            View activity
          </Link>
          {item.bookId ? (
            <CopyLinkButton
              path={bookDetailsPath(item.bookId)}
              label="Copy link"
              variant="ghost"
              size="sm"
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}
