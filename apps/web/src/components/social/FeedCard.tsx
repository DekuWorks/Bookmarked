"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useState } from "react";
import { FeedBookAttachment } from "@/components/social/FeedBookAttachment";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { StarDisplay } from "@/components/reviews/StarDisplay";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ShareContentModal } from "@/components/social/ShareContentModal";
import { ReplyThread } from "@/components/social/ReplyThread";
import { MentionText } from "@/components/social/MentionText";
import { feedItemHref, isClubActivityEvent } from "@/lib/routes/activity";
import { readerProfilePath } from "@/lib/routes/reader";
import { bookDetailsPath } from "@/lib/routes/book";
import { deleteOwnActivity, isFeedEligibleEvent } from "@/lib/services/activity";
import {
  addReviewReply,
  deleteReviewReply,
  listReviewReplies,
} from "@/lib/services/reviewEngagement";
import type { FeedItem } from "@/lib/services/socialFeed";
import type { ReviewReplyWithAuthor } from "@/types";
import type { ThreadNode } from "@/lib/utils/threadReplies";
import { usePreferredLocale } from "@/lib/hooks/usePreferredLocale";
import { useSpoilerReveal } from "@/lib/hooks/useSpoilerReveal";
import { feedOriginExtras } from "@/lib/feedNav";
import { formatFeedTimestamp } from "@/lib/utils/locale";
import { buildActivityShareComposerPayload } from "@bookmarked/utils/sharePreview";
import { SPOILER_WARNING_COPY } from "@bookmarked/utils/spoilerReveal";
import { BrandChromeIcon } from "@/components/icons/BrandChromeIcon";

type Props = {
  item: FeedItem;
  viewerId?: string;
  onDeleted?: (activityId: string) => void;
};

function readerLabel(item: FeedItem): string {
  return item.profiles?.display_name?.trim() || item.profiles?.username?.trim() || "Reader";
}

function readerHref(item: FeedItem): string | null {
  const username = item.profiles?.username?.trim();
  return username ? readerProfilePath(username) : null;
}

type ReviewReplyNode = Omit<ReviewReplyWithAuthor, "children">;

export const FeedCard = memo(function FeedCard({ item, viewerId, onDeleted }: Props) {
  const locale = usePreferredLocale();
  const toast = useToast();
  const spoiler = useSpoilerReveal();
  const [shareOpen, setShareOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [replies, setReplies] = useState<ThreadNode<ReviewReplyNode>[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const profileHref = readerHref(item);
  const originExtras = feedOriginExtras();
  const activityHref = feedItemHref(item, originExtras);
  const showBookCover =
    isFeedEligibleEvent(item.event_type) || Boolean(item.bookId || item.coverUrl);
  const isReviewEvent =
    item.event_type === "review_created" || item.event_type === "review_added";
  const reviewRating =
    isReviewEvent && typeof item.metadata_json?.rating === "number"
      ? Number(item.metadata_json.rating)
      : null;
  const isOwn = Boolean(viewerId && item.user_id === viewerId);
  const isClub = isClubActivityEvent(item.event_type);
  const hiddenSpoiler = Boolean(item.hasSpoilers && item.reviewBody && !spoiler.revealed);

  const loadReplies = useCallback(async () => {
    if (!item.reviewId) return;
    setRepliesLoading(true);
    try {
      setReplies(await listReviewReplies(item.reviewId));
    } catch {
      toast.error("Could not load comments.");
    } finally {
      setRepliesLoading(false);
    }
  }, [item.reviewId, toast]);

  useEffect(() => {
    if (commentsOpen && item.reviewId) void loadReplies();
  }, [commentsOpen, item.reviewId, loadReplies]);

  const sharePayload = buildActivityShareComposerPayload({
    activityId: item.id,
    title: item.bookTitle?.trim() || `${readerLabel(item)} · activity`,
    body: `${readerLabel(item)} ${item.actionMessage}`,
    actorName: readerLabel(item),
    actorAvatarUrl: item.profiles?.avatar_url,
    bookId: item.bookId ?? null,
    bookCoverUrl: item.coverUrl ?? null,
    destinationPath: activityHref,
    createdAt: item.created_at,
  });

  async function handleDelete() {
    if (!viewerId) return;
    const confirmed = window.confirm(
      "Delete this activity from your feed? The original book, review, or post will not be deleted."
    );
    if (!confirmed) return;

    setDeleting(true);
    const result = await deleteOwnActivity(item.id, viewerId);
    setDeleting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Activity removed.");
    onDeleted?.(item.id);
  }

  return (
    <article className="surface-card p-5 text-left sm:p-6">
      <div className="flex gap-3">
        {item.profiles ? (
          profileHref ? (
            <Link
              href={profileHref}
              className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
            >
              <ProfileAvatar profile={item.profiles} size="sm" />
            </Link>
          ) : (
            <ProfileAvatar profile={item.profiles} size="sm" className="shrink-0" />
          )
        ) : null}
        <div className="min-w-0 flex-1 text-left">
          <p className="text-left text-base leading-relaxed text-text">
            {profileHref ? (
              <Link
                href={profileHref}
                className="font-semibold text-puce-red hover:underline"
              >
                {readerLabel(item)}
              </Link>
            ) : (
              <span className="font-semibold text-puce-red">{readerLabel(item)}</span>
            )}{" "}
            <Link href={activityHref} className="hover:text-primary hover:underline">
              {item.actionMessage}
            </Link>
          </p>
          <p className="mt-1 text-left text-xs text-text-muted">
            <time suppressHydrationWarning dateTime={item.created_at}>
              {formatFeedTimestamp(item.created_at, locale)}
            </time>
          </p>
          {reviewRating != null ? (
            <div className="mt-2.5 inline-flex rounded-lg bg-background/80 px-3 py-2">
              <StarDisplay rating={reviewRating} showNumeric />
            </div>
          ) : null}
        </div>
      </div>

      {showBookCover && item.bookId ? (
        <div className="mt-4">
          <FeedBookAttachment
            book={{
              id: item.bookId,
              title: item.bookTitle,
              author: item.bookAuthor,
              cover_url: item.coverUrl,
            }}
            variant="compact"
            originExtras={originExtras}
          />
        </div>
      ) : showBookCover ? (
        <Link
          href={activityHref}
          className="mt-4 flex h-24 w-16 items-center justify-center overflow-hidden rounded-lg bg-primary/15 text-2xl shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
        >
          <BrandChromeIcon name="library" className="h-8 w-8" />
        </Link>
      ) : null}

      {item.reviewBody ? (
        hiddenSpoiler ? (
          <button
            type="button"
            onClick={spoiler.toggle}
            className="mt-4 w-full rounded-lg bg-primary/10 px-3 py-3 text-left text-sm font-medium text-puce-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
          >
            {SPOILER_WARNING_COPY.hidden}
          </button>
        ) : (
          <div className="mt-4 text-sm leading-relaxed text-text">
            {item.hasSpoilers ? (
              <button
                type="button"
                onClick={spoiler.toggle}
                className="mb-2 text-xs font-medium text-text-muted hover:text-primary"
              >
                {SPOILER_WARNING_COPY.hide}
              </button>
            ) : null}
            <MentionText body={item.reviewBody} />
          </div>
        )
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
        {item.reviewId ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setCommentsOpen((open) => !open)}>
            {commentsOpen ? "Hide comments" : "Comments"}
          </Button>
        ) : isClub ? (
          <Link
            href={activityHref}
            className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
          >
            Comments
          </Link>
        ) : null}
        <Link
          href={activityHref}
          className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
        >
          View activity
        </Link>
        {viewerId ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => setShareOpen(true)}>
            Share
          </Button>
        ) : null}
        {item.bookId ? (
          <Link
            href={bookDetailsPath(item.bookId, originExtras)}
            className="text-sm font-medium text-text-muted hover:text-primary hover:underline"
          >
            Open book
          </Link>
        ) : null}
        {isOwn ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            loading={deleting}
            onClick={() => void handleDelete()}
          >
            Delete Activity
          </Button>
        ) : null}
      </div>

      {commentsOpen && item.reviewId && viewerId ? (
        <div className="mt-3">
          {repliesLoading ? (
            <p className="text-sm text-text-muted">Loading comments…</p>
          ) : (
            <ReplyThread
              replies={replies}
              viewerId={viewerId}
              onSubmitReply={(body, parentReplyId, attachmentUrl) =>
                addReviewReply(item.reviewId!, body, parentReplyId, attachmentUrl)
              }
              onDeleteReply={deleteReviewReply}
              onRefresh={() => void loadReplies()}
              composerPlaceholder="Reply to this review…"
            />
          )}
        </div>
      ) : null}

      {viewerId ? (
        <ShareContentModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          currentUserId={viewerId}
          payload={sharePayload}
        />
      ) : null}
    </article>
  );
});
