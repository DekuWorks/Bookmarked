"use client";

import Link from "next/link";
import { memo } from "react";
import { FeedBookAttachment } from "@/components/social/FeedBookAttachment";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { StarDisplay } from "@/components/reviews/StarDisplay";
import { CopyLinkButton } from "@/components/ui/CopyLinkButton";
import { feedItemHref } from "@/lib/routes/activity";
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

export const FeedCard = memo(function FeedCard({ item }: Props) {
  const locale = usePreferredLocale();
  const profileHref = readerHref(item);
  const activityHref = feedItemHref(item);
  const showBookCover =
    isFeedEligibleEvent(item.event_type) || Boolean(item.bookId || item.coverUrl);
  const isReviewEvent =
    item.event_type === "review_created" || item.event_type === "review_added";
  const reviewRating =
    isReviewEvent && typeof item.metadata_json?.rating === "number"
      ? Number(item.metadata_json.rating)
      : null;

  return (
    <article className="surface-card p-5 sm:p-6">
      <div className="flex gap-3">
        {item.profiles ? (
          profileHref ? (
            <Link
              href={profileHref}
              className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
            >
              <ProfileAvatar profile={item.profiles} size="sm" />
            </Link>
          ) : (
            <ProfileAvatar profile={item.profiles} size="sm" className="shrink-0" />
          )
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-base leading-relaxed text-text">
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
          {reviewRating != null ? (
            <div className="mt-2.5 inline-flex rounded-lg bg-background/80 px-3 py-2">
              <StarDisplay rating={reviewRating} showNumeric />
            </div>
          ) : null}
        </div>
      </div>

      {showBookCover && item.bookId ? (
        <div className="mt-4">
          <FeedBookAttachment
            book={{
              id: item.bookId,
              title: item.bookTitle,
              author: item.bookAuthor,
              cover_url: item.coverUrl,
            }}
            variant="compact"
          />
        </div>
      ) : showBookCover ? (
        <Link
          href={activityHref}
          className="mt-4 flex h-24 w-16 items-center justify-center overflow-hidden rounded-lg bg-primary/15 text-2xl shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
        >
          📚
        </Link>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
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
    </article>
  );
});
