"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { ContentReactionBar } from "@/components/social/ContentReactionBar";
import { MentionText } from "@/components/social/MentionText";
import { ReplyThread } from "@/components/social/ReplyThread";
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
import type { ReactionCounts } from "@/types";
import type { ThreadNode } from "@/lib/utils/threadReplies";
import type { ReviewReplyWithAuthor } from "@/types";

type ReviewReplyNode = Omit<ReviewReplyWithAuthor, "children">;

const initial: BookActionState = {};

type Props = {
  displayName: string;
  rating?: number | null;
  reviewBody?: string | null;
  hasSpoilers?: boolean;
  createdAt?: string;
  isOwnReview?: boolean;
  bookId?: string;
  reviewId?: string;
  viewerId?: string | null;
  onReviewChange?: () => void;
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

export function ReviewCard({
  displayName,
  rating,
  reviewBody,
  hasSpoilers,
  createdAt,
  isOwnReview = false,
  bookId,
  reviewId,
  viewerId,
  onReviewChange,
}: Props) {
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editRating, setEditRating] = useState(rating ? Number(rating) : 0);
  const [editBody, setEditBody] = useState(reviewBody ?? "");
  const [editSpoilers, setEditSpoilers] = useState(Boolean(hasSpoilers));
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

  const canEngage = Boolean(viewerId && reviewId);

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
    if (!isEditing) {
      setEditRating(rating ? Number(rating) : 0);
      setEditBody(reviewBody ?? "");
      setEditSpoilers(Boolean(hasSpoilers));
    }
  }, [rating, reviewBody, hasSpoilers, isEditing]);

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

  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-semibold text-puce-red">{displayName}</span>
        {!isEditing && rating != null ? (
          <span className="text-sm text-royal-orange">
            {"★".repeat(Math.round(rating))}
            {"☆".repeat(5 - Math.round(rating))}
          </span>
        ) : null}
        {!isEditing && hasSpoilers ? (
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
                fd.set("book_id", bookId);
                deleteAction(fd);
              }}
            >
              Delete
            </Button>
          </span>
        ) : null}
      </div>

      {isEditing && canManage ? (
        <form action={saveAction} className="space-y-3 text-left">
          <input type="hidden" name="book_id" value={bookId} />
          <input type="hidden" name="rating" value={editRating || ""} />
          <div>
            <p className="mb-1.5 text-sm font-medium text-text">Rating</p>
            <StarRating value={editRating} onChange={setEditRating} />
          </div>
          <Textarea
            label="Review"
            name="review_body"
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            placeholder="What did you think?"
            className="mb-0"
          />
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              name="has_spoilers"
              checked={editSpoilers}
              onChange={(e) => setEditSpoilers(e.target.checked)}
              className="rounded border-border"
            />
            Contains spoilers
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="primary" size="sm" loading={saving}>
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              loading={deleting}
              onClick={() => {
                const fd = new FormData();
                fd.set("review_id", reviewId);
                fd.set("book_id", bookId);
                deleteAction(fd);
              }}
            >
              Delete
            </Button>
          </div>
        </form>
      ) : reviewBody ? (
        hasSpoilers ? (
          <div className="group relative">
            <p
              className="cursor-default select-none text-sm leading-relaxed text-text blur-md transition-[filter] duration-200 group-hover:blur-none group-focus-within:blur-none"
              tabIndex={0}
            >
              <MentionText body={reviewBody} />
            </p>
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-medium text-text-muted opacity-100 transition-opacity group-hover:opacity-0 group-focus-within:opacity-0">
              Hover to reveal spoilers
            </p>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-text">
            <MentionText body={reviewBody} />
          </p>
        )
      ) : (
        <p className="text-sm text-text-muted italic">Rating only — no written review.</p>
      )}

      {createdAt && !isEditing ? (
        <p className="mt-2 text-xs text-text-muted">
          <time suppressHydrationWarning dateTime={createdAt}>
            {new Date(createdAt).toLocaleDateString()}
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
                  onSubmitReply={(body, parentReplyId) =>
                    addReviewReply(reviewId!, body, parentReplyId)
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
