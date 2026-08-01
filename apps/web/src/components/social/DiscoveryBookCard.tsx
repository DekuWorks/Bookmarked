"use client";

import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { StarDisplay } from "@/components/reviews/StarDisplay";
import type { TrendingBook } from "@/lib/services/trending";
import { bookDetailsPath } from "@/lib/routes/book";
import {
  DISCOVERY_CARD_ROW_PX,
  clampDiscoveryTags,
  discoveryReviewState,
  discoveryReviewSummaryLabel,
} from "@bookmarked/utils/discoveryCard";
import { formatRatingCount } from "@bookmarked/utils/communityRating";

type Props = {
  book: TrendingBook & {
    reviewPreview?: string | null;
    tags?: string[] | null;
    hasWrittenReview?: boolean;
  };
};

/**
 * Equal-height discovery carousel card.
 * Fixed-height rows (`DISCOVERY_CARD_ROW_PX`) with overflow hidden keep covers/titles
 * aligned across rating/review/tag variance.
 */
export function DiscoveryBookCard({ book }: Props) {
  const hasRating = Boolean(book.communityRating);
  const hasWritten = Boolean(book.hasWrittenReview || book.reviewPreview?.trim());
  const reviewState = discoveryReviewState({
    hasRating,
    hasWrittenReview: hasWritten,
  });
  const tags = clampDiscoveryTags(book.tags);
  const summary = discoveryReviewSummaryLabel(reviewState);

  return (
    <li className="flex w-[7.5rem] shrink-0 flex-col">
      <Link
        href={bookDetailsPath(book.bookId)}
        className="group flex h-full flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
      >
        <div
          className="relative w-[7.5rem] shrink-0 overflow-hidden rounded-lg border border-border bg-white shadow-sm"
          style={{ height: DISCOVERY_CARD_ROW_PX.coverHeight }}
        >
          <BookCover
            title={book.title}
            author={book.author}
            coverUrl={book.coverUrl}
            className="h-full w-full"
            sizes="120px"
          />
        </div>

        <p
          className="mt-2 line-clamp-2 overflow-hidden text-xs font-semibold leading-snug text-text group-hover:text-puce-red"
          style={{ height: DISCOVERY_CARD_ROW_PX.title }}
        >
          {book.title}
        </p>

        <p
          className="mt-0.5 line-clamp-1 overflow-hidden text-[11px] text-text-muted"
          style={{ height: DISCOVERY_CARD_ROW_PX.author }}
        >
          {book.author?.trim() || "\u00a0"}
        </p>

        <div
          className="mt-1 flex items-center gap-1 overflow-hidden"
          style={{ height: DISCOVERY_CARD_ROW_PX.rating }}
        >
          {book.communityRating ? (
            <>
              <StarDisplay rating={book.communityRating.averageRating} showNumeric />
              <span className="text-[10px] text-text-muted">
                ({formatRatingCount(book.communityRating.ratingCount)})
              </span>
            </>
          ) : (
            <p className="line-clamp-1 text-[11px] text-text-muted">{summary}</p>
          )}
        </div>

        <p
          className="mt-1 line-clamp-2 overflow-hidden text-[11px] italic text-text-muted"
          style={{ height: DISCOVERY_CARD_ROW_PX.review }}
        >
          {book.reviewPreview?.trim() || "\u00a0"}
        </p>

        <div
          className="mt-1 flex flex-wrap gap-1 overflow-hidden"
          style={{ height: DISCOVERY_CARD_ROW_PX.tags }}
        >
          {tags.length
            ? tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-puce-red"
                >
                  {tag}
                </span>
              ))
            : null}
        </div>

        <p
          className="mt-auto overflow-hidden pt-1 text-[11px] font-medium text-primary"
          style={{ height: DISCOVERY_CARD_ROW_PX.metric }}
        >
          {book.metric} {book.metricLabel}
        </p>
      </Link>
    </li>
  );
}
