"use client";

import { useState } from "react";
import { FollowListModal } from "@/components/social/FollowListModal";
import type { FollowCounts, FollowListKind } from "@/lib/services/follows";
import { cn } from "@/lib/utils/cn";

type Props = {
  profileUserId: string;
  viewerId: string;
  profileName: string;
  counts: FollowCounts;
  className?: string;
  size?: "sm" | "md";
};

function StatButton({
  label,
  count,
  onClick,
  size,
}: {
  label: string;
  count: number;
  onClick: () => void;
  size: "sm" | "md";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg text-left transition-colors",
        "hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange",
        size === "md" ? "px-2 py-1" : "px-1 py-0.5"
      )}
    >
      <dt className="text-text-muted">{label}</dt>
      <dd
        className={cn(
          "font-semibold text-text",
          size === "md" ? "text-lg" : "text-base"
        )}
      >
        {count}
      </dd>
    </button>
  );
}

export function FollowStats({
  profileUserId,
  viewerId,
  profileName,
  counts,
  className,
  size = "sm",
}: Props) {
  const [modalKind, setModalKind] = useState<FollowListKind | null>(null);
  const isOwnProfile = profileUserId === viewerId;

  return (
    <>
      <dl className={cn("flex gap-6 text-sm", className)}>
        <StatButton
          label="Followers"
          count={counts.followers}
          onClick={() => setModalKind("followers")}
          size={size}
        />
        <StatButton
          label="Following"
          count={counts.following}
          onClick={() => setModalKind("following")}
          size={size}
        />
      </dl>

      {modalKind ? (
        <FollowListModal
          open
          onClose={() => setModalKind(null)}
          kind={modalKind}
          profileUserId={profileUserId}
          viewerId={viewerId}
          profileName={profileName}
          isOwnProfile={isOwnProfile}
        />
      ) : null}
    </>
  );
}
