"use client";

import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { usePreferredLocale } from "@/lib/hooks/usePreferredLocale";
import { formatFeedTimestamp } from "@/lib/utils/locale";
import type { BookClubDiscussionWithAuthor } from "@/types";

type Props = {
  discussion: BookClubDiscussionWithAuthor;
  onOpen?: () => void;
};

function authorLabel(author: BookClubDiscussionWithAuthor["author"]): string {
  return author.display_name?.trim() || author.username?.trim() || "Reader";
}

export function ClubDiscussionCard({ discussion, onOpen }: Props) {
  const locale = usePreferredLocale();
  const label = authorLabel(discussion.author);

  return (
    <article className="rounded-xl border border-border bg-surface p-4 text-left shadow-sm transition-colors hover:border-primary/40">
      <button
        type="button"
        onClick={onOpen}
        className="w-full text-left"
        aria-label={`Open discussion: ${discussion.title}`}
      >
        <div className="flex gap-3 text-left">
          <ProfileAvatar profile={discussion.author} size="sm" className="shrink-0" />
          <div className="min-w-0 flex-1 text-left">
            <p className="text-left text-sm font-semibold text-puce-red">{label}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-left">
              <h3 className="text-left font-semibold text-text">{discussion.title}</h3>
              {discussion.is_pinned ? (
                <span className="rounded-full bg-royal-orange/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-royal-orange">
                  Pinned
                </span>
              ) : null}
              {discussion.is_locked ? (
                <span className="rounded-full bg-border/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                  Locked
                </span>
              ) : null}
              {discussion.contains_spoilers ? (
                <span className="rounded-full bg-rust/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rust">
                  Spoilers
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-left text-xs text-text-muted">
              {discussion.reply_count} {discussion.reply_count === 1 ? "reply" : "replies"}
              <span aria-hidden> · </span>
              <time suppressHydrationWarning dateTime={discussion.latest_activity_at}>
                {formatFeedTimestamp(discussion.latest_activity_at, locale)}
              </time>
            </p>
            <p className="mt-2 line-clamp-2 text-left text-sm leading-relaxed text-text">
              {discussion.body}
            </p>
            {discussion.book ? (
              <p className="mt-2 text-left text-xs text-text-muted">
                Re: <span className="font-medium text-primary">{discussion.book.title}</span>
              </p>
            ) : null}
          </div>
        </div>
      </button>
    </article>
  );
}
