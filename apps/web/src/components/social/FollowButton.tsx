"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { followUser, unfollowUser } from "@/lib/services/follows";

type Props = {
  targetUserId: string;
  initialFollowing: boolean;
  onChange?: (following: boolean) => void;
};

export function FollowButton({ targetUserId, initialFollowing, onChange }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setLoading(true);
    setError(null);

    const result = following
      ? await unfollowUser(targetUserId)
      : await followUser(targetUserId);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const next = !following;
    setFollowing(next);
    onChange?.(next);
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant={following ? "outline" : "secondary"}
        size="sm"
        loading={loading}
        onClick={() => void toggle()}
      >
        {following ? "Following" : "Follow"}
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
