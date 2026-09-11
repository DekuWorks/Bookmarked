"use client";

import Link from "next/link";
import { usePreferredLocale } from "@/lib/hooks/usePreferredLocale";
import { formatFeedTimestamp } from "@/lib/utils/locale";
import { formatReplyCount } from "@bookmarked/utils/clubDiscussionUi";
import { clubDetailPath } from "@/lib/routes/clubs";
import type { RecentClubDiscussion } from "@/lib/services/bookClubs";

type Props = {
  discussion: RecentClubDiscussion;
};

/**
 * Hub card for a recent discussion thread — title primary, club secondary.
 * Taps straight into the discussion thread.
 */
export function RecentDiscussionCard({ discussion }: Props) {
  const locale = usePreferredLocale();
  const href = clubDetailPath(discussion.club.id, {
    tab: "discussions",
    discussionId: discussion.id,
  });

  return (
    <li>
      <Link
        href={href}
        className="block rounded-lg px-2 py-1.5 transition hover:bg-background"
        aria-label={`Open discussion: ${discussion.title}`}
      >
        <p className="truncate text-sm font-medium text-text">{discussion.title}</p>
        <p className="truncate text-xs text-text-muted">{discussion.club.name}</p>
        <p className="mt-0.5 text-xs text-text-muted">
          {formatReplyCount(discussion.reply_count)}
          <span aria-hidden> · </span>
          <time suppressHydrationWarning dateTime={discussion.latest_activity_at}>
            {formatFeedTimestamp(discussion.latest_activity_at, locale)}
          </time>
        </p>
      </Link>
    </li>
  );
}
