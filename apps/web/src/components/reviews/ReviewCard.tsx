"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ContentReactionBar } from "@/components/social/ContentReactionBar";
import { MentionText } from "@/components/social/MentionText";
import { ReplyThread } from "@/components/social/ReplyThread";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { StarDisplay } from "@/components/reviews/StarDisplay";
import { useToast } from "@/components/ui/Toast";
import {
  deleteReview,
  saveReview,
  type BookActionState,
} from "@/lib/actions/book";
import {
  addReviewReply,
  deleteReviewReply,
  dislikeReview,
  getReviewReactionCounts,
  likeReview,
  listReviewReplies,
} from "@/lib/services/reviewEngagement";
import { readerProfilePath } from "@/lib/routes/reader";
import { readNumberLabel } from "@/lib/utils/ratings";
import type { ReactionCounts, Review, ReviewReplyWithAuthor } from "@/types";
import type { ThreadNode } from "@/lib/utils/threadReplies";
import { usePreferredLocale } from "@/lib/hooks/usePreferredLocale";
import { formatReviewDate } from "@/lib/utils/locale";

type ReviewReplyNode = Omit<ReviewReplyWithAuthor, "children">;

const initial: BookActionState = {};

const ASPECT_LABELS: { key: keyof Review; label: string }[] = [
  { key: "plot", label: "Plot" },
  { key: "characters", label: "Characters" },
  { key: "writing_style", label: "Writing" },
  { key: "world_building", label: "World" },
  { key: "pacing", label: "Pacing" },
  { key: "emotional_impact", label: "Emotion" },
];

type Props = {
  review: Review;
  displayName: string;
  /** When set, display name links to the reviewer's public profile. */
  profileUsername?: string | null;
  isOwnReview?: boolean;
  bookId?: string;
  viewerId?: string | null;
  onReviewChange?: () => void;
};

export function ReviewCard({
  review,
  displayName,
  profileUsername,
  isOwnReview = false,
  bookId,
  viewerId,
  onReviewChange,
}: Props) {
  const toast = useToast();
  const locale = usePreferredLocale();
  const [isEditing, setIsEditing] = useState(false);
  const [saveState, saveAction, saving] = useActionState(saveReview, initial);
  const [deleteState, deleteAction, deleting] = useActionState(deleteReview, initial);
  const [reactions, setReactions] = useState<ReactionCounts>({
    like_count: 0,
    dislike_count: 0,
    viewer_reaction: null,
  });
  const [reactionLoading, setReactionLoading] = useState(false);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [replies, setReplies] = useState<ThreadNode<ReviewReplyNode>[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);

  const reviewId = review.id;
  const canEngage = Boolean(viewerId && reviewId && !isOwnReview);
  const profileHref = profileUsername?.trim()
    ? readerProfilePath(profileUsername.trim())
    : null;

  const loadReactions = useCallback(async () => {
    if (!reviewId) return;
    const counts = await getReviewReactionCounts([reviewId], viewerId ?? null);
    const next = counts.get(reviewId);
    if (next) setReactions(next);
  }, [reviewId, viewerId]);

  const loadReplies = useCallback(async () => {
    if (!reviewId) return;
    setRepliesLoading(true);
    try {
      const next = await listReviewReplies(reviewId);
      setReplies(next);
    } catch {
      toast.error("Could not load replies.");
    } finally {
      setRepliesLoading(false);
    }
  }, [reviewId, toast]);

  useEffect(() => {
    if (saveState.error) toast.error(saveState.error);
    if (saveState.success) {
      toast.success(saveState.success);
      setIsEditing(false);
      onReviewChange?.();
    }
  }, [saveState, toast, onReviewChange]);

  useEffect(() => {
    if (deleteState.error) toast.error(deleteState.error);
    if (deleteState.success) {
      toast.success(deleteState.success);
      setIsEditing(false);
      onReviewChange?.();
    }
  }, [deleteState, toast, onReviewChange]);

  useEffect(() => {
    if (canEngage) void loadReactions();
  }, [canEngage, loadReactions]);

  useEffect(() => {
    if (repliesOpen && reviewId) void loadReplies();
  }, [repliesOpen, reviewId, loadReplies]);

  async function handleLike() {
    if (!reviewId) return;
    setReactionLoading(true);
    const result = await likeReview(reviewId);
    setReactionLoading(false);
    if (result.error) toast.error(result.error);
    else if (result.counts) setReactions(result.counts);
  }

  async function handleDislike() {
    if (!reviewId) return;
    setReactionLoading(true);
    const result = await dislikeReview(reviewId);
    setReactionLoading(false);
    if (result.error) toast.error(result.error);
    else if (result.counts) setReactions(result.counts);
  }

  const canManage = isOwnReview && bookId && reviewId;
  const aspectRatings = ASPECT_LABELS.filter(
    ({ key }) => review[key] != null && Number(review[key]) > 0
  );

  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {profileHref ? (
          <Link
            href={profileHref}
            className="font-semibold text-puce-red hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
          >
            {displayName}
          </Link>
        ) : (
          <span className="font-semibold text-puce-red">{displayName}</span>
        )}
        {!isEditing && review.rating != null ? (
          <span className="inline-flex items-center gap-1.5">
            <StarDisplay rating={Number(review.rating)} />
            {review.rating_emoji ? (
              <span className="text-lg leading-none" aria-label="Rating emoji">
                {review.rating_emoji}
              </span>
            ) : null}
          </span>
        ) : null}
        {!isEditing ? (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-puce-red">
            {readNumberLabel(review.read_number)}
          </span>
        ) : null}
        {!isEditing && review.has_spoilers ? (
          <span className="rounded-full bg-rust/15 px-2 py-0.5 text-xs text-rust">
            Spoilers
          </span>
        ) : null}
        {canManage && !isEditing ? (
          <span className="ml-auto flex gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              loading={deleting}
              onClick={() => {
                const fd = new FormData();
                fd.set("review_id", reviewId);
                deleteAction(fd);
              }}
            >
              Delete
            </Button>
          </span>
        ) : null}
      </div>

      {isEditing && canManage ? (
        <ReviewForm
          bookId={bookId}
          readNumber={review.read_number}
          reviewId={reviewId}
          initial={review}
          formAction={saveAction}
          pending={saving}
          submitLabel="Save review"
        />
      ) : (
        <>
          {review.edition ? (
            <p className="mb-2 text-xs text-text-muted">Edition: {review.edition}</p>
          ) : null}

          {review.feelings?.length ? (
            <div className="mb-2 flex flex-wrap gap-1">
              {review.feelings.map((feeling) => (
                <span
                  key={feeling}
                  className="rounded-full bg-orange-yellow/25 px-2 py-0.5 text-xs text-puce-red"
                >
                  {feeling}
                </span>
              ))}
            </div>
          ) : null}

          {aspectRatings.length > 0 ? (
            <dl className="mb-3 grid gap-2 text-xs sm:grid-cols-2">
              {aspectRatings.map(({ key, label }) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-2 rounded-lg bg-background px-2 py-1"
                >
                  <dt className="text-text-muted">{label}</dt>
                  <dd>
                    <StarDisplay rating={Number(review[key])} />
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          {review.review_body ? (
            review.has_spoilers ? (
              <div className="group relative">
                <p
                  className="cursor-default select-none text-sm leading-relaxed text-text blur-md transition-[filter] duration-200 group-hover:blur-none group-focus-within:blur-none"
                  tabIndex={0}
                >
                  <MentionText body={review.review_body} />
                </p>
                <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-medium text-text-muted opacity-100 transition-opacity group-hover:opacity-0 group-focus-within:opacity-0">
                  Hover to reveal spoilers
                </p>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-text">
                <MentionText body={review.review_body} />
              </p>
            )
          ) : (
            <p className="text-sm text-text-muted italic">Rating only — no written review.</p>
          )}
        </>
      )}

      {review.created_at && !isEditing ? (
        <p className="mt-2 text-xs text-text-muted">
          <time suppressHydrationWarning dateTime={review.created_at}>
            {formatReviewDate(review.created_at, locale)}
          </time>
        </p>
      ) : null}

      {canEngage && !isEditing ? (
        <div className="mt-3 border-t border-border pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <ContentReactionBar
              likeCount={reactions.like_count}
              dislikeCount={reactions.dislike_count}
              viewerReaction={reactions.viewer_reaction}
              onLike={() => void handleLike()}
              onDislike={() => void handleDislike()}
              loading={reactionLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRepliesOpen((open) => !open)}
            >
              {repliesOpen ? "Hide replies" : "Reply"}
            </Button>
          </div>

          {repliesOpen ? (
            <div className="mt-3">
              {repliesLoading ? (
                <p className="text-sm text-text-muted">Loading replies…</p>
              ) : (
                <ReplyThread
                  replies={replies}
                  viewerId={viewerId!}
                  onSubmitReply={(body, parentReplyId, attachmentUrl) =>
                    addReviewReply(reviewId!, body, parentReplyId, attachmentUrl)
                  }
                  onDeleteReply={deleteReviewReply}
                  onRefresh={() => void loadReplies()}
                  composerPlaceholder="Reply to this review…"
                />
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
