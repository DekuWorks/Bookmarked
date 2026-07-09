"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { StarRating } from "@/components/reviews/StarRating";
import { REVIEW_FEELINGS } from "@/lib/constants/reviewFeelings";
import { cn } from "@/lib/utils/cn";
import type { Review, ReviewRatingMode } from "@/types";

const ASPECT_FIELDS = [
  { key: "plot", label: "Plot" },
  { key: "characters", label: "Characters" },
  { key: "writing_style", label: "Writing style" },
  { key: "world_building", label: "World building" },
  { key: "pacing", label: "Pacing" },
  { key: "emotional_impact", label: "Emotional impact" },
] as const;

type AspectKey = (typeof ASPECT_FIELDS)[number]["key"];

type Props = {
  bookId: string;
  readNumber: number;
  reviewId?: string;
  initial?: Partial<Review>;
  formAction: (payload: FormData) => void;
  pending?: boolean;
  submitLabel?: string;
};

export function ReviewForm({
  bookId,
  readNumber,
  reviewId,
  initial,
  formAction,
  pending = false,
  submitLabel = "Publish review",
}: Props) {
  const [mode, setMode] = useState<ReviewRatingMode>(initial?.rating_mode ?? "regular");
  const [rating, setRating] = useState(initial?.rating ? Number(initial.rating) : 0);
  const [edition, setEdition] = useState(initial?.edition ?? "");
  const [reviewBody, setReviewBody] = useState(initial?.review_body ?? "");
  const [hasSpoilers, setHasSpoilers] = useState(Boolean(initial?.has_spoilers));
  const [feelings, setFeelings] = useState<string[]>(initial?.feelings ?? []);
  const [aspects, setAspects] = useState<Record<AspectKey, number>>({
    plot: initial?.plot ? Number(initial.plot) : 0,
    characters: initial?.characters ? Number(initial.characters) : 0,
    writing_style: initial?.writing_style ? Number(initial.writing_style) : 0,
    world_building: initial?.world_building ? Number(initial.world_building) : 0,
    pacing: initial?.pacing ? Number(initial.pacing) : 0,
    emotional_impact: initial?.emotional_impact ? Number(initial.emotional_impact) : 0,
  });

  function toggleFeeling(tag: string) {
    setFeelings((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="book_id" value={bookId} />
      <input type="hidden" name="read_number" value={readNumber} />
      <input type="hidden" name="rating_mode" value={mode} />
      <input type="hidden" name="rating" value={rating || ""} />
      <input type="hidden" name="edition" value={edition} />
      {reviewId ? <input type="hidden" name="review_id" value={reviewId} /> : null}
      {feelings.map((feeling) => (
        <input key={feeling} type="hidden" name="feelings" value={feeling} />
      ))}
      {ASPECT_FIELDS.map(({ key }) => (
        <input
          key={key}
          type="hidden"
          name={key}
          value={aspects[key] > 0 ? aspects[key] : ""}
        />
      ))}

      <div
        className="flex rounded-lg border border-border bg-background p-1"
        role="tablist"
        aria-label="Review type"
      >
        {(["regular", "advanced"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={mode === tab}
            onClick={() => setMode(tab)}
            className={cn(
              "min-h-[40px] flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition",
              mode === tab
                ? "bg-puce-red text-white shadow-sm"
                : "text-text-muted hover:bg-surface hover:text-text"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-text">Overall rating</p>
        <StarRating value={rating} onChange={setRating} />
      </div>

      <Input
        label="Edition (optional)"
        value={edition}
        onChange={(e) => setEdition(e.target.value)}
        placeholder="Hardcover, audiobook, translation…"
      />

      {mode === "advanced" ? (
        <>
          <div>
            <p className="mb-2 text-sm font-medium text-text">Category ratings</p>
            <div className="space-y-3">
              {ASPECT_FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <p className="mb-1 text-xs text-text-muted">{label}</p>
                  <StarRating
                    value={aspects[key]}
                    onChange={(value) =>
                      setAspects((current) => ({ ...current, [key]: value }))
                    }
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-text">How did it make you feel?</p>
            <div className="flex flex-wrap gap-2">
              {REVIEW_FEELINGS.map((feeling) => {
                const active = feelings.includes(feeling);
                return (
                  <button
                    key={feeling}
                    type="button"
                    onClick={() => toggleFeeling(feeling)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition",
                      active
                        ? "border-puce-red bg-puce-red text-white"
                        : "border-border bg-background text-text-muted hover:border-primary"
                    )}
                  >
                    {feeling}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}

      <Textarea
        label="Review"
        name="review_body"
        value={reviewBody}
        onChange={(e) => setReviewBody(e.target.value)}
        placeholder="What did you think?"
      />

      <label className="flex items-center gap-2 text-sm text-text">
        <input
          type="checkbox"
          name="has_spoilers"
          checked={hasSpoilers}
          onChange={(e) => setHasSpoilers(e.target.checked)}
          className="rounded border-border"
        />
        Contains spoilers
      </label>

      <Button type="submit" variant="primary" loading={pending} disabled={rating < 0.5}>
        {submitLabel}
      </Button>
    </form>
  );
}
