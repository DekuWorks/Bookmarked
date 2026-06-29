"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { useToast } from "@/components/ui/Toast";
import {
  deleteReview,
  saveReview,
  type BookActionState,
} from "@/lib/actions/book";
import type { Review } from "@/types";
import { cn } from "@/lib/utils/cn";

const initial: BookActionState = {};

type ReviewTab = "all" | "spoilers";

type Props = {
  bookId: string;
  ownReview: Review | null;
  reviews: Review[];
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

export function BookReviewSection({ bookId, ownReview, reviews }: Props) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState(saveReview, initial);
  const [deleteState, deleteAction, deleting] = useActionState(deleteReview, initial);
  const [rating, setRating] = useState(ownReview?.rating ? Number(ownReview.rating) : 0);
  const [reviewTab, setReviewTab] = useState<ReviewTab>("all");

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) toast.success(state.success);
  }, [state, toast]);

  useEffect(() => {
    if (deleteState.error) toast.error(deleteState.error);
    if (deleteState.success) toast.success(deleteState.success);
  }, [deleteState, toast]);

  const others = reviews.filter((r) => r.id !== ownReview?.id);
  const spoilerReviews = others.filter((r) => r.has_spoilers);
  const visibleReviews = useMemo(() => {
    if (reviewTab === "spoilers") return spoilerReviews;
    return others;
  }, [others, reviewTab, spoilerReviews]);

  const REVIEW_TABS: { id: ReviewTab; label: string; count: number }[] = [
    { id: "all", label: "All reviews", count: others.length },
    { id: "spoilers", label: "Contains spoilers", count: spoilerReviews.length },
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-puce-red">
          {ownReview ? "Your review" : "Write a review"}
        </h2>
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
            defaultValue={ownReview?.review_body ?? ""}
            placeholder="What did you think?"
          />
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              name="has_spoilers"
              defaultChecked={ownReview?.has_spoilers}
              className="rounded border-border"
            />
            Contains spoilers
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="primary" loading={pending}>
              {ownReview ? "Update review" : "Publish review"}
            </Button>
            {ownReview ? (
              <Button
                type="button"
                variant="ghost"
                loading={deleting}
                onClick={() => {
                  const fd = new FormData();
                  fd.set("review_id", ownReview.id);
                  fd.set("book_id", bookId);
                  deleteAction(fd);
                }}
              >
                Delete
              </Button>
            ) : null}
          </div>
        </form>
      </div>

      <div>
        <div className="mb-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <h3 className="text-lg font-semibold text-puce-red">Community reviews</h3>
          {others.length > 0 ? (
            <div
              className="flex w-full max-w-full rounded-lg border border-border bg-surface p-1 shadow-sm sm:w-auto"
              role="tablist"
              aria-label="Community review filters"
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
            {visibleReviews.map((review) => (
              <li key={review.id}>
                <ReviewCard
                  displayName={
                    review.profiles?.display_name ??
                    review.profiles?.username ??
                    "Reader"
                  }
                  rating={review.rating}
                  reviewBody={review.review_body}
                  hasSpoilers={review.has_spoilers}
                  createdAt={review.created_at}
                />
              </li>
            ))}
          </ul>
        ) : reviewTab === "spoilers" ? (
          <p className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-text-muted">
            No spoiler-tagged reviews yet.
          </p>
        ) : (
          <p className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-text-muted">
            No reviews from other readers yet.
          </p>
        )}
      </div>
    </section>
  );
}
