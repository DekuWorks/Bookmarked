"use client";

import Link from "next/link";
import { useState } from "react";
import { FollowButton } from "@/components/social/FollowButton";
import { readerProfilePath } from "@/lib/routes/reader";
import type { FollowListUser } from "@/lib/services/follows";

type Props = {
  user: FollowListUser;
  viewerId: string;
  onNavigate?: () => void;
};

export function FollowListRow({ user, viewerId, onNavigate }: Props) {
  const [following, setFollowing] = useState(user.viewerFollows);
  const displayName = user.display_name?.trim() || user.username?.trim() || "Reader";
  const username = user.username?.trim();
  const isSelf = user.id === viewerId;

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-3">
      <div className="min-w-0 flex-1">
        {username ? (
          <Link
            href={readerProfilePath(username)}
            onClick={onNavigate}
            className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
          >
            <p className="font-semibold text-puce-red hover:underline">{displayName}</p>
            <p className="text-sm text-text-muted">@{username}</p>
          </Link>
        ) : (
          <p className="font-semibold text-puce-red">{displayName}</p>
        )}
        {user.isMutual ? (
          <p className="mt-1 text-xs font-medium text-royal-orange">Mutual</p>
        ) : user.followsViewer && !user.viewerFollows ? (
          <p className="mt-1 text-xs text-text-muted">Follows you</p>
        ) : null}
      </div>

      {!isSelf && username ? (
        <FollowButton
          targetUserId={user.id}
          initialFollowing={following}
          onChange={setFollowing}
        />
      ) : null}
    </li>
  );
}
