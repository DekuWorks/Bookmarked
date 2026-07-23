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
  /** Center the follower / following row (profile headers). */
  align?: "start" | "center";
};

function StatButton({
  label,
  count,
  onClick,
  size,
  centered,
}: {
  label: string;
  count: number;
  onClick: () => void;
  size: "sm" | "md";
  centered?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg transition-colors",
        centered ? "text-center" : "text-left",
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
  align = "start",
}: Props) {
  const [modalKind, setModalKind] = useState<FollowListKind | null>(null);
  const isOwnProfile = profileUserId === viewerId;
  const centered = align === "center";

  return (
    <>
      <dl className={cn("flex gap-6 text-sm", centered && "justify-center", className)}>
        <StatButton
          label="Followers"
          count={counts.followers}
          onClick={() => setModalKind("followers")}
          size={size}
          centered={centered}
        />
        <StatButton
          label="Following"
          count={counts.following}
          onClick={() => setModalKind("following")}
          size={size}
          centered={centered}
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
