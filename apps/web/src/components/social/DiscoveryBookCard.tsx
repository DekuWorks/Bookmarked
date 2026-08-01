"use client";

import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { CommunityRatingDisplay } from "@/components/books/CommunityRatingDisplay";
import type { TrendingBook } from "@/lib/services/trending";
import { bookDetailsPath } from "@/lib/routes/book";
import {
  clampDiscoveryTags,
  discoveryReviewState,
  discoveryReviewSummaryLabel,
} from "@bookmarked/utils/discoveryCard";

type Props = {
  book: TrendingBook & {
    reviewPreview?: string | null;
    tags?: string[] | null;
    hasWrittenReview?: boolean;
  };
};

/**
 * Equal-height discovery carousel card.
 * Fixed internal rows so covers/titles align across rating/review/tag variance.
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
        <div className="relative h-40 w-[7.5rem] shrink-0 overflow-visible rounded-lg border border-border bg-white shadow-sm">
          <BookCover
            title={book.title}
            author={book.author}
            coverUrl={book.coverUrl}
            className="h-full w-full"
            sizes="120px"
          />
        </div>

        <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-xs font-semibold leading-snug text-text group-hover:text-puce-red">
          {book.title}
        </p>

        <p className="mt-0.5 line-clamp-1 min-h-[1rem] text-[11px] text-text-muted">
          {book.author?.trim() || "\u00a0"}
        </p>

        <div className="mt-1 min-h-[2.75rem]">
          {book.communityRating ? (
            <CommunityRatingDisplay
              rating={book.communityRating}
              className="justify-start gap-1"
            />
          ) : (
            <p className="text-[11px] text-text-muted">{summary}</p>
          )}
          {hasRating && hasWritten ? (
            <p className="mt-0.5 text-[10px] text-text-muted">{summary}</p>
          ) : null}
        </div>

        <p className="mt-1 line-clamp-2 min-h-[2rem] text-[11px] italic text-text-muted">
          {book.reviewPreview?.trim() || "\u00a0"}
        </p>

        <div className="mt-1 flex min-h-[1.5rem] flex-wrap gap-1">
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

        <p className="mt-auto pt-1 text-[11px] font-medium text-primary">
          {book.metric} {book.metricLabel}
        </p>
      </Link>
    </li>
  );
}
