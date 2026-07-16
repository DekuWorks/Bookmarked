"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { useToast } from "@/components/ui/Toast";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { saveReview, type BookActionState } from "@/lib/actions/book";
import { readNumberLabel } from "@/lib/utils/ratings";
import type { Review } from "@/types";
import { cn } from "@/lib/utils/cn";

const initial: BookActionState = {};

type ReviewTab = "all" | "regular" | "spoilers";

type Props = {
  bookId: string;
  readNumber: number;
  ownReviews: Review[];
  reviews: Review[];
  onReviewsChange?: () => void;
};

export function BookReviewSection({
  bookId,
  readNumber,
  ownReviews,
  reviews,
  onReviewsChange,
}: Props) {
  const user = useAuthUser();
  const toast = useToast();
  const [state, formAction, pending] = useActionState(saveReview, initial);
  const [reviewTab, setReviewTab] = useState<ReviewTab>("all");

  const reviewForCurrentRead = ownReviews.find((r) => r.read_number === readNumber) ?? null;
  const canWriteReview = !reviewForCurrentRead;

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success(state.success);
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
      {canWriteReview ? (
        <div className="rounded-xl border border-border bg-surface p-5 text-left">
          <h2 className="text-lg font-semibold text-puce-red">
            Write a review — {readNumberLabel(readNumber)}
          </h2>
          <div className="mt-4">
            <ReviewForm
              bookId={bookId}
              readNumber={readNumber}
              formAction={formAction}
              pending={pending}
            />
          </div>
        </div>
      ) : null}

      {ownReviews.length > 0 ? (
        <div className="text-left">
          <h3 className="mb-3 text-lg font-semibold text-puce-red">Your reviews</h3>
          <ul className="space-y-3">
            {ownReviews.map((review) => (
              <li key={review.id}>
                <ReviewCard
                  review={review}
                  displayName={`Your review — ${readNumberLabel(review.read_number)}`}
                  isOwnReview
                  bookId={bookId}
                  viewerId={user?.id ?? null}
                  onReviewChange={onReviewsChange}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <div className="mb-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <h3 className="text-lg font-semibold text-puce-red">Community reviews</h3>
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

        {visibleReviews.some((r) => r.user_id !== user?.id) ? (
          <ul className="space-y-3 text-left">
            {visibleReviews.map((review) => {
              const isOwnReview = Boolean(user && review.user_id === user.id);
              if (isOwnReview) return null;
              return (
                <li key={review.id}>
                  <ReviewCard
                    review={review}
                    displayName={
                      review.profiles?.display_name ??
                      review.profiles?.username ??
                      "Reader"
                    }
                    profileUsername={review.profiles?.username}
                    viewerId={user?.id ?? null}
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
