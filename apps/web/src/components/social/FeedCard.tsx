"use client";

import Link from "next/link";
import { memo, useState } from "react";
import { FeedBookAttachment } from "@/components/social/FeedBookAttachment";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { StarDisplay } from "@/components/reviews/StarDisplay";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ShareContentModal } from "@/components/social/ShareContentModal";
import { feedItemHref } from "@/lib/routes/activity";
import { readerProfilePath } from "@/lib/routes/reader";
import { bookDetailsPath } from "@/lib/routes/book";
import { deleteOwnActivity, isFeedEligibleEvent } from "@/lib/services/activity";
import type { FeedItem } from "@/lib/services/socialFeed";
import { usePreferredLocale } from "@/lib/hooks/usePreferredLocale";
import { formatFeedTimestamp } from "@/lib/utils/locale";
import { buildActivityShareComposerPayload } from "@bookmarked/utils/sharePreview";

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

export const FeedCard = memo(function FeedCard({ item, viewerId, onDeleted }: Props) {
  const locale = usePreferredLocale();
  const toast = useToast();
  const [shareOpen, setShareOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const profileHref = readerHref(item);
  const activityHref = feedItemHref(item);
  const showBookCover =
    isFeedEligibleEvent(item.event_type) || Boolean(item.bookId || item.coverUrl);
  const isReviewEvent =
    item.event_type === "review_created" || item.event_type === "review_added";
  const reviewRating =
    isReviewEvent && typeof item.metadata_json?.rating === "number"
      ? Number(item.metadata_json.rating)
      : null;
  const isOwn = Boolean(viewerId && item.user_id === viewerId);

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
          />
        </div>
      ) : showBookCover ? (
        <Link
          href={activityHref}
          className="mt-4 flex h-24 w-16 items-center justify-center overflow-hidden rounded-lg bg-primary/15 text-2xl shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
        >
          📚
        </Link>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
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
            href={bookDetailsPath(item.bookId)}
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
