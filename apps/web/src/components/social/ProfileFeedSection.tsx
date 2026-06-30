"use client";

import { useSearchParams } from "next/navigation";
import {
  FeedPostsPanel,
  parseFeedTab,
  PROFILE_PREVIEW_LIMIT,
  type FeedTab,
} from "@/components/social/FeedPostsPanel";

type Props = {
  userId: string;
  className?: string;
};

function profileTabHref(tab: FeedTab): string {
  if (tab === "for-you") return "/profile/";
  return `/profile/?tab=${tab}`;
}

export function ProfileFeedSection({ userId, className }: Props) {
  const searchParams = useSearchParams();
  const tab = parseFeedTab(searchParams.get("tab"));

  return (
    <FeedPostsPanel
      userId={userId}
      tab={tab}
      tabHref={profileTabHref}
      showComposer
      showViewFeedLink
      previewLimit={PROFILE_PREVIEW_LIMIT}
      className={className}
    />
  );
}
