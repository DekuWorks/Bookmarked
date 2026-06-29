"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { useToast } from "@/components/ui/Toast";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { saveReview, type BookActionState } from "@/lib/actions/book";
import type { Review } from "@/types";
import { cn } from "@/lib/utils/cn";

const initial: BookActionState = {};

type ReviewTab = "all" | "regular" | "spoilers";

type Props = {
  bookId: string;
  ownReview: Review | null;
  reviews: Review[];
  onReviewsChange?: () => void;
};

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
          onClick={() => onChange(star)}
          className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-2xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange rounded-lg ${star <= value ? "text-royal-orange" : "text-border"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function BookReviewSection({
  bookId,
  ownReview,
  reviews,
  onReviewsChange,
}: Props) {
  const user = useAuthUser();
  const toast = useToast();
  const [state, formAction, pending] = useActionState(saveReview, initial);
  const [rating, setRating] = useState(0);
  const [reviewTab, setReviewTab] = useState<ReviewTab>("all");

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success(state.success);
      setRating(0);
      onReviewsChange?.();
    }
  }, [state, toast, onReviewsChange]);

  const regularReviews = reviews.filter((r) => !r.has_spoilers);
  const spoilerReviews = reviews.filter((r) => r.has_spoilers);
  const visibleReviews = useMemo(() => {
    if (reviewTab === "regular") return regularReviews;
    if (reviewTab === "spoilers") return spoilerReviews;
    return reviews;
  }, [reviews, reviewTab, regularReviews, spoilerReviews]);

  const REVIEW_TABS: { id: ReviewTab; label: string; count: number }[] = [
    { id: "all", label: "All reviews", count: reviews.length },
    { id: "regular", label: "Regular", count: regularReviews.length },
    { id: "spoilers", label: "Contains spoilers", count: spoilerReviews.length },
  ];

  return (
    <section id="book-reviews" className="space-y-6">
      {!ownReview ? (
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold text-puce-red">Write a review</h2>
          <form action={formAction} className="mt-4 space-y-3">
            <input type="hidden" name="book_id" value={bookId} />
            <input type="hidden" name="rating" value={rating || ""} />
            <div>
              <p className="mb-1.5 text-sm font-medium text-text">Rating</p>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <Textarea
              label="Review"
              name="review_body"
              placeholder="What did you think?"
            />
            <label className="flex items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                name="has_spoilers"
                className="rounded border-border"
              />
              Contains spoilers
            </label>
            <Button type="submit" variant="primary" loading={pending}>
              Publish review
            </Button>
          </form>
        </div>
      ) : null}

      <div>
        <div className="mb-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <h3 className="text-lg font-semibold text-puce-red">
            {ownReview ? "Reviews" : "Community reviews"}
          </h3>
          {reviews.length > 0 ? (
            <div
              className="flex w-full max-w-full rounded-lg border border-border bg-surface p-1 shadow-sm sm:w-auto"
              role="tablist"
              aria-label="Review filters"
            >
              {REVIEW_TABS.map(({ id, label, count }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={reviewTab === id}
                  onClick={() => setReviewTab(id)}
                  className={cn(
                    "min-h-[40px] flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition sm:flex-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange",
                    reviewTab === id
                      ? "bg-puce-red text-white shadow-sm"
                      : "text-text-muted hover:bg-background hover:text-text"
                  )}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {visibleReviews.length > 0 ? (
          <ul className="space-y-3">
            {visibleReviews.map((review) => {
              const isOwnReview = Boolean(user && review.user_id === user.id);
              return (
                <li key={review.id}>
                  <ReviewCard
                    displayName={
                      isOwnReview
                        ? "Your review"
                        : (review.profiles?.display_name ??
                          review.profiles?.username ??
                          "Reader")
                    }
                    rating={review.rating}
                    reviewBody={review.review_body}
                    hasSpoilers={review.has_spoilers}
                    createdAt={review.created_at}
                    isOwnReview={isOwnReview}
                    bookId={bookId}
                    reviewId={review.id}
                    onReviewChange={onReviewsChange}
                  />
                </li>
              );
            })}
          </ul>
        ) : reviewTab === "regular" ? (
          <p className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-text-muted">
            No regular reviews yet. Reviews without the spoiler tag will appear here.
          </p>
        ) : reviewTab === "spoilers" ? (
          <p className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-text-muted">
            No spoiler-tagged reviews yet.
          </p>
        ) : (
          <p className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-text-muted">
            No reviews yet. Be the first to share your thoughts.
          </p>
        )}
      </div>
    </section>
  );
}
