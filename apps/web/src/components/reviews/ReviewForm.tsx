"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { MAX_REVIEW_BODY_LENGTH } from "@/lib/constants/validation";
import { StarRating } from "@/components/reviews/StarRating";
import { REVIEW_FEELINGS } from "@/lib/constants/reviewFeelings";
import {
  REVIEW_RATING_EMOJIS,
  REVIEW_RATING_EMOJI_MAX_LENGTH,
  sanitizeRatingEmoji,
} from "@/lib/constants/reviewEmojis";
import { cn } from "@/lib/utils/cn";
import { BOOK_EDITION_PRESETS } from "@/lib/constants/bookEditions";
import type { Review, ReviewRatingMode } from "@/types";
import {
  parseReviewAudience,
  type ReviewAudience,
} from "@bookmarked/utils/reviewVisibility";
import { REREAD_LIKELIHOOD_SCALE } from "@bookmarked/utils/plusReviews";
import { ReviewVisibilityControl } from "@/components/reviews/ReviewVisibilityControl";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useSubscription } from "@/lib/hooks/useSubscription";

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
  onVisibilityPersist?: (visibility: ReviewAudience) => void | Promise<void>;
};

export function ReviewForm({
  bookId,
  readNumber,
  reviewId,
  initial,
  formAction,
  pending = false,
  submitLabel = "Publish review",
  onVisibilityPersist,
}: Props) {
  const [mode, setMode] = useState<ReviewRatingMode>(initial?.rating_mode ?? "regular");
  const [rating, setRating] = useState(initial?.rating ? Number(initial.rating) : 0);
  const [ratingEmoji, setRatingEmoji] = useState(initial?.rating_emoji ?? "");
  const initialPreset =
    initial?.edition &&
    BOOK_EDITION_PRESETS.includes(initial.edition as (typeof BOOK_EDITION_PRESETS)[number])
      ? initial.edition
      : "";
  const [editionPreset, setEditionPreset] = useState(initialPreset);
  const [customEdition, setCustomEdition] = useState(
    initial?.edition && !initialPreset ? initial.edition : ""
  );
  const [editionMode, setEditionMode] = useState<"preset" | "custom" | "none">(
    initial?.edition ? (initialPreset ? "preset" : "custom") : "none"
  );
  const [reviewBody, setReviewBody] = useState(initial?.review_body ?? "");
  const [hasSpoilers, setHasSpoilers] = useState(Boolean(initial?.has_spoilers));
  const [visibility, setVisibility] = useState<ReviewAudience>(
    parseReviewAudience(initial?.visibility)
  );
  const [feelings, setFeelings] = useState<string[]>(initial?.feelings ?? []);
  const user = useAuthUser();
  const { canAccess } = useSubscription(user?.id);
  const plusReviews = canAccess("advanced_reviews");
  const [wouldRecommend, setWouldRecommend] = useState<"yes" | "no" | "">(
    initial?.would_recommend === true ? "yes" : initial?.would_recommend === false ? "no" : ""
  );
  const [favoriteChapter, setFavoriteChapter] = useState(
    initial?.favorite_chapter_number ? String(initial.favorite_chapter_number) : ""
  );
  const [chapterReview, setChapterReview] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [characterScore, setCharacterScore] = useState(0);
  const [rereadLikelihood, setRereadLikelihood] = useState(
    initial?.reread_likelihood ? Number(initial.reread_likelihood) : 0
  );
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

  function pickEdition(value: string) {
    if (!value) {
      setEditionMode("none");
      setEditionPreset("");
      return;
    }
    setEditionPreset(value);
    setEditionMode("preset");
    setCustomEdition("");
  }

  const editionValue =
    editionMode === "custom" ? customEdition.trim() : editionMode === "preset" ? editionPreset : "";

  function pickEmoji(emoji: string) {
    setRatingEmoji((current) => (current === emoji ? "" : emoji));
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="book_id" value={bookId} />
      <input type="hidden" name="read_number" value={readNumber} />
      <input type="hidden" name="rating_mode" value={mode} />
      <input type="hidden" name="rating" value={rating || ""} />
      <input type="hidden" name="rating_emoji" value={sanitizeRatingEmoji(ratingEmoji) ?? ""} />
      <input type="hidden" name="edition" value={editionValue} />
      <input type="hidden" name="would_recommend" value={wouldRecommend} />
      <input type="hidden" name="favorite_chapter_number" value={favoriteChapter} />
      <input type="hidden" name="chapter_review_body" value={chapterReview} />
      <input type="hidden" name="character_name" value={characterName} />
      <input type="hidden" name="character_score" value={characterScore || ""} />
      <input type="hidden" name="reread_likelihood" value={rereadLikelihood || ""} />
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

      <div>
        <p className="mb-1.5 text-sm font-medium text-text">
          Rating emoji <span className="font-normal text-text-muted">(optional)</span>
        </p>
        <p className="mb-2 text-xs text-text-muted">
          Pick a signature emoji to show with your rating — like ⚡ for Harry Potter.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {REVIEW_RATING_EMOJIS.map((emoji) => {
            const active = ratingEmoji === emoji;
            return (
              <button
                key={emoji}
                type="button"
                aria-pressed={active}
                aria-label={`Use ${emoji} as your rating emoji`}
                onClick={() => pickEmoji(emoji)}
                className={cn(
                  "flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border text-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange",
                  active
                    ? "border-puce-red bg-puce-red/10 shadow-sm"
                    : "border-border bg-background hover:border-primary"
                )}
              >
                {emoji}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Input
            aria-label="Pick your own rating emoji"
            value={ratingEmoji}
            onChange={(e) => setRatingEmoji(e.target.value.slice(0, REVIEW_RATING_EMOJI_MAX_LENGTH))}
            placeholder="Or type your own…"
            className="max-w-[10rem]"
          />
          {ratingEmoji ? (
            <button
              type="button"
              onClick={() => setRatingEmoji("")}
              className="text-xs font-medium text-text-muted hover:text-puce-red"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-text">
          Edition <span className="font-normal text-text-muted">(optional)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {BOOK_EDITION_PRESETS.map((preset) => {
            const active = editionMode === "preset" && editionPreset === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => pickEdition(active ? "" : preset)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  active
                    ? "border-puce-red bg-puce-red text-white"
                    : "border-border bg-background text-text-muted hover:border-primary"
                )}
              >
                {preset}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              if (editionMode === "custom") {
                setEditionMode("none");
                setCustomEdition("");
              } else {
                setEditionMode("custom");
                setEditionPreset("");
              }
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              editionMode === "custom"
                ? "border-puce-red bg-puce-red text-white"
                : "border-border bg-background text-text-muted hover:border-primary"
            )}
          >
            Other
          </button>
        </div>
        {editionMode === "custom" ? (
          <Input
            className="mt-2"
            value={customEdition}
            onChange={(e) => setCustomEdition(e.target.value)}
            placeholder="Translation, special edition…"
          />
        ) : null}
      </div>

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
        maxLength={MAX_REVIEW_BODY_LENGTH}
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

      {plusReviews ? (
        <div className="space-y-3 rounded-xl border border-border p-3">
          <p className="text-sm font-medium text-puce-red">Plus review extras</p>
          <div className="flex gap-2">
            {(["yes", "no"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setWouldRecommend((current) => (current === value ? "" : value))}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  wouldRecommend === value
                    ? "border-puce-red bg-puce-red text-white"
                    : "border-border text-text-muted"
                )}
              >
                {value === "yes" ? "Would recommend" : "Would not recommend"}
              </button>
            ))}
          </div>
          <Input
            label="Favorite chapter number"
            value={favoriteChapter}
            onChange={(e) => setFavoriteChapter(e.target.value)}
            placeholder="Manual chapter number"
          />
          <Textarea
            label="Chapter review"
            value={chapterReview}
            onChange={(e) => setChapterReview(e.target.value)}
            placeholder="Optional notes for that chapter"
          />
          <div>
            <p className="mb-1.5 text-sm font-medium text-text">
              Reread likelihood <span className="font-normal text-text-muted">(optional)</span>
            </p>
            <StarRating
              value={rereadLikelihood}
              onChange={setRereadLikelihood}
              label="Reread likelihood"
            />
            <p className="mt-1 text-xs text-text-muted">{REREAD_LIKELIHOOD_SCALE.note}</p>
          </div>
          <Input
            label="Character name"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            placeholder="Your name for them — optional, not required to publish"
          />
          <div>
            <p className="mb-1.5 text-sm font-medium text-text">
              Character rating <span className="font-normal text-text-muted">(optional)</span>
            </p>
            <StarRating
              value={characterScore}
              onChange={setCharacterScore}
              size="sm"
              label="Character rating"
            />
          </div>
        </div>
      ) : null}

      <ReviewVisibilityControl
        value={visibility}
        disabled={pending}
        onChange={(next) => {
          setVisibility(next);
          if (reviewId && next !== visibility) {
            void onVisibilityPersist?.(next);
          }
        }}
      />

      <Button type="submit" variant="primary" loading={pending} disabled={rating < 0.5}>
        {submitLabel}
      </Button>
    </form>
  );
}
