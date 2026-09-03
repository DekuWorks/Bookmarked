"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookCover } from "@/components/books/BookCover";
import { StarDisplay } from "@/components/reviews/StarDisplay";
import { LoadingState } from "@/components/ui/LoadingState";
import { bookDetailsPath } from "@/lib/routes/book";
import type { UserReviewWithBook } from "@/lib/services/readingRoom";
import { cn } from "@/lib/utils/cn";
import { formatReviewDate } from "@/lib/utils/locale";
import { usePreferredLocale } from "@/lib/hooks/usePreferredLocale";
import {
  filterReviews,
  groupReviewsByMonth,
  hasStarRating,
  hasWrittenReview,
  REVIEW_FILTER_OPTIONS,
  REVIEW_PANEL_COPY,
  type ReviewFilter,
} from "@bookmarked/utils/readingRoomReviews";
import { ShareReviewButton } from "@/components/reading-room/ShareReviewButton";

type Props = {
  reviews: UserReviewWithBook[] | null;
};

export function ReviewsPanel({ reviews }: Props) {
  const locale = usePreferredLocale();
  const [filter, setFilter] = useState<ReviewFilter>("all");

  const filtered = useMemo(
    () => (reviews ? filterReviews(reviews, filter) : []),
    [reviews, filter]
  );

  return (
    <section className="rounded-2xl border border-border bg-surface/90 p-5 text-left shadow-sm md:p-6">
      <h2 className="text-center text-lg font-semibold text-puce-red">{REVIEW_PANEL_COPY.title}</h2>
      <p className="mt-1 text-center text-sm text-text-muted">{REVIEW_PANEL_COPY.subtitle}</p>

      {reviews === null ? (
        <LoadingState message="Loading reviews…" />
      ) : reviews.length === 0 ? (
        <p className="mt-6 text-center text-sm text-text-muted">
          Finish a book and share your thoughts from its detail page.
        </p>
      ) : (
        <>
          <div
            className="review-filter-row isolate mt-4 h-10 overflow-x-auto overflow-y-hidden"
            style={{ flex: "0 0 auto" }}
            role="group"
            aria-label="Filter reviews"
          >
            <div className="flex h-10 w-max flex-nowrap items-center justify-start gap-2">
            {REVIEW_FILTER_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                aria-pressed={filter === option.id}
                className={cn(
                  "h-8 shrink-0 rounded-full border px-3 text-xs font-medium leading-8 transition",
                  filter === option.id
                    ? "border-puce-red bg-puce-red text-white"
                    : "border-border bg-background text-text-muted hover:border-primary"
                )}
              >
                {option.label}
              </button>
            ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="mt-6 text-center text-sm text-text-muted">
              No reviews match this filter.
            </p>
          ) : (
            <div className="mt-6 space-y-8">
              {groupReviewsByMonth(filtered).map(([month, monthReviews]) => (
                <div key={month}>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
                    {month}
                  </h3>
                  <ul className="mt-3 space-y-4">
                    {monthReviews.map((review) => (
                      <ReviewHistoryCard key={review.id} review={review} locale={locale} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function ReviewHistoryCard({
  review,
  locale,
}: {
  review: UserReviewWithBook;
  locale: string;
}) {
  const book = review.books;
  const bookHref = book?.id ? bookDetailsPath(book.id) : null;
  const written = hasWrittenReview(review);
  const rated = hasStarRating(review);

  return (
    <li className="rounded-xl border border-border bg-background/50 p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        {book ? (
          <div className="mx-auto w-[70px] shrink-0 sm:mx-0 sm:w-[110px]">
            {bookHref ? (
              <Link href={bookHref} className="block">
                <BookCover
                  title={book.title}
                  author={book.author}
                  coverUrl={book.cover_url}
                  className="aspect-[2/3] w-full rounded shadow-sm"
                  sizes="(max-width: 640px) 90px, 120px"
                />
              </Link>
            ) : (
              <BookCover
                title={book.title}
                author={book.author}
                coverUrl={book.cover_url}
                className="aspect-[2/3] w-full rounded shadow-sm"
                sizes="(max-width: 640px) 90px, 120px"
              />
            )}
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-2">
            <div className="min-w-0 flex-1">
              {bookHref ? (
                <Link
                  href={bookHref}
                  className="font-semibold text-primary hover:underline"
                >
                  {book?.title ?? "Review"}
                </Link>
              ) : (
                <p className="font-semibold text-text">{book?.title ?? "Review"}</p>
              )}
              {book?.author ? (
                <p className="text-sm text-text-muted">{book.author}</p>
              ) : null}
            </div>
            {review.read_number > 1 ? (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-puce-red">
                Read #{review.read_number}
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {rated ? (
              <StarDisplay rating={review.rating!} />
            ) : written ? (
              <span className="text-xs text-text-muted">No star rating</span>
            ) : null}
            {review.edition ? (
              <span className="text-xs text-text-muted">· {review.edition}</span>
            ) : null}
            {review.has_spoilers ? (
              <span className="rounded-full bg-rust/15 px-2 py-0.5 text-xs font-medium text-rust">
                Spoilers
              </span>
            ) : null}
            <time className="text-xs text-text-muted" dateTime={review.created_at}>
              {formatReviewDate(review.created_at, locale)}
            </time>
          </div>

          {review.feelings?.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {review.feelings.map((feeling) => (
                <span
                  key={feeling}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-puce-red"
                >
                  {feeling}
                </span>
              ))}
            </div>
          ) : null}

          {written ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-muted">
              {review.review_body}
            </p>
          ) : rated ? (
            <p className="mt-2 text-sm italic text-text-muted">
              Rating only — no written review.
            </p>
          ) : null}

          <div className="mt-3 flex justify-end">
            {book?.id ? <ShareReviewButton review={review} /> : null}
          </div>
        </div>
      </div>
    </li>
  );
}
