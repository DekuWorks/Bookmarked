"use client";

import { Button } from "@/components/ui/Button";
import type { ContentReaction } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  likeCount: number;
  dislikeCount: number;
  viewerReaction: ContentReaction | null;
  onLike: () => void;
  onDislike: () => void;
  loading?: boolean;
  className?: string;
};

export function ContentReactionBar({
  likeCount,
  dislikeCount,
  viewerReaction,
  onLike,
  onDislike,
  loading = false,
  className,
}: Props) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        loading={loading}
        aria-pressed={viewerReaction === "like"}
        onClick={onLike}
        className={cn(viewerReaction === "like" && "text-royal-orange")}
      >
        👍 {likeCount > 0 ? likeCount : null}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        loading={loading}
        aria-pressed={viewerReaction === "dislike"}
        onClick={onDislike}
        className={cn(viewerReaction === "dislike" && "text-rust")}
      >
        👎 {dislikeCount > 0 ? dislikeCount : null}
      </Button>
    </div>
  );
}
