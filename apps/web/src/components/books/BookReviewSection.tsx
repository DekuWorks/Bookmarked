"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { useToast } from "@/components/ui/Toast";
import {
  deleteReview,
  saveReview,
  type BookActionState,
} from "@/lib/actions/book";
import type { Review } from "@/types";

const initial: BookActionState = {};

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

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) toast.success(state.success);
  }, [state, toast]);

  useEffect(() => {
    if (deleteState.error) toast.error(deleteState.error);
    if (deleteState.success) toast.success(deleteState.success);
  }, [deleteState, toast]);

  const others = reviews.filter((r) => r.id !== ownReview?.id);

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
        <h3 className="mb-3 text-lg font-semibold text-puce-red">Community reviews</h3>
        {others.length > 0 ? (
          <ul className="space-y-3">
            {others.map((review) => (
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
        ) : (
          <p className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-text-muted">
            No reviews from other readers yet.
          </p>
        )}
      </div>
    </section>
  );
}
