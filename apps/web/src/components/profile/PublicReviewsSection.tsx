"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookCover } from "@/components/books/BookCover";
import { StarDisplay } from "@/components/reviews/StarDisplay";
import { LoadingState } from "@/components/ui/LoadingState";
import { bookDetailsPath } from "@/lib/routes/book";
import {
  listPublicUserReviews,
  type UserReviewWithBook,
} from "@/lib/services/readingRoom";
import { cn } from "@/lib/utils/cn";
import {
  hasStarRating,
  hasWrittenReview,
} from "@bookmarked/utils/readingRoomReviews";

type Props = {
  userId: string;
  readerName: string;
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "rated", label: "Rated" },
  { id: "written", label: "Written" },
] as const;
type PublicReviewFilter = (typeof FILTERS)[number]["id"];

export function PublicReviewsSection({ userId, readerName }: Props) {
  const [reviews, setReviews] = useState<UserReviewWithBook[] | null>(null);
  const [filter, setFilter] = useState<PublicReviewFilter>("all");

  useEffect(() => {
    let cancelled = false;
    void listPublicUserReviews(userId).then((nextReviews) => {
      if (!cancelled) setReviews(nextReviews);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const filtered = useMemo(
    () => reviews?.filter((review) =>
      filter === "all" || (filter === "rated" ? hasStarRating(review) : hasWrittenReview(review))
    ) ?? [],
    [reviews, filter]
  );

  return (
    <section className="rounded-xl border border-border bg-surface p-6 text-left shadow-sm">
      <h2 className="text-lg font-semibold text-puce-red">Public reviews</h2>
      <p className="mt-1 text-sm text-text-muted">
        Ratings and reviews {readerName} has chosen to share.
      </p>

      {reviews === null ? (
        <div className="mt-4"><LoadingState message="Loading public reviews…" /></div>
      ) : reviews.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">No public reviews yet.</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter public reviews">
            {FILTERS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                aria-pressed={filter === option.id}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  filter === option.id
                    ? "border-puce-red bg-puce-red text-white"
                    : "border-border bg-background text-text-muted hover:border-primary"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <p className="mt-4 text-sm text-text-muted">No public reviews match this filter.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {filtered.map((review) => <PublicReviewCard key={review.id} review={review} />)}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

function PublicReviewCard({ review }: { review: UserReviewWithBook }) {
  const [revealed, setRevealed] = useState(!review.has_spoilers);
  const written = hasWrittenReview(review);
  const rated = hasStarRating(review);
  const book = review.books;

  return (
    <li className="flex gap-3 rounded-xl border border-border bg-background/50 p-3">
      {book ? (
        <Link href={bookDetailsPath(book.id)} className="w-14 shrink-0">
          <BookCover title={book.title} author={book.author} coverUrl={book.cover_url} className="aspect-[2/3] w-full rounded shadow-sm" />
        </Link>
      ) : null}
      <div className="min-w-0 flex-1">
        {book ? <Link href={bookDetailsPath(book.id)} className="font-semibold text-primary hover:underline">{book.title}</Link> : <p className="font-semibold text-text">Review</p>}
        {book?.author ? <p className="text-xs text-text-muted">{book.author}</p> : null}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {rated ? <StarDisplay rating={review.rating!} /> : written ? <span className="text-xs text-text-muted">Written review</span> : null}
          {review.has_spoilers ? <span className="rounded-full bg-rust/15 px-2 py-0.5 text-xs font-medium text-rust">Spoilers</span> : null}
        </div>
        {written ? (
          <div className="mt-2">
            <p className={cn("whitespace-pre-wrap text-sm leading-relaxed text-text-muted", !revealed && "select-none blur-sm")} aria-hidden={!revealed}>
              {review.review_body}
            </p>
            {review.has_spoilers ? (
              <button type="button" onClick={() => setRevealed((value) => !value)} className="mt-2 text-xs font-medium text-primary hover:underline">
                {revealed ? "Hide spoilers" : "Reveal spoilers"}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}
