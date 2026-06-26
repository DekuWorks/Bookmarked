"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FollowButton } from "@/components/social/FollowButton";
import { ProfileMessageButton } from "@/components/messages/ProfileMessageButton";
import { FeedCard } from "@/components/social/FeedCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { getFollowCounts, isFollowing, type FollowCounts } from "@/lib/services/follows";
import { getProfileByUsername } from "@/lib/services/profile";
import { fetchReaderActivity } from "@/lib/services/socialFeed";
import type { FeedItem } from "@/lib/services/socialFeed";
import type { Profile } from "@/types";
import { ProfileShelfPreview } from "@/components/profile/ProfileShelfPreview";
import { FollowStats } from "@/components/social/FollowStats";

type ReaderData = {
  profile: Profile;
  counts: FollowCounts;
  following: boolean;
  activity: FeedItem[];
};

function ReaderProfileContent() {
  const searchParams = useSearchParams();
  const username = searchParams.get("username")?.trim() ?? "";
  const user = useAuthUser();
  const [data, setData] = useState<ReaderData | null | undefined>(undefined);

  useEffect(() => {
    if (!username) {
      setData(null);
      return;
    }
    if (!user) return;

    void (async () => {
      const profile = await getProfileByUsername(username);
      if (!profile) {
        setData(null);
        return;
      }

      const [counts, following, activity] = await Promise.all([
        getFollowCounts(profile.id),
        user.id === profile.id ? Promise.resolve(false) : isFollowing(user.id, profile.id),
        fetchReaderActivity(profile.id, user.id),
      ]);

      setData({ profile, counts, following, activity });
    })();
  }, [username, user]);

  if (!username) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-text-muted">No reader selected.</p>
        <ButtonLink href="/feed" variant="primary">
          Back to feed
        </ButtonLink>
      </div>
    );
  }

  if (user === undefined || data === undefined) {
    return <LoadingState message="Loading reader…" />;
  }

  if (!user || !data) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-text-muted">Reader not found.</p>
        <ButtonLink href="/feed" variant="primary">
          Back to feed
        </ButtonLink>
      </div>
    );
  }

  const { profile, counts, following, activity } = data;
  const isSelf = user.id === profile.id;
  const displayName = profile.display_name?.trim() || profile.username || "Reader";

  return (
    <div className="mx-auto max-w-2xl space-y-8 text-center">
      <header className="rounded-xl border border-border bg-surface p-6 text-center shadow-sm">
        <div className="flex flex-col items-center justify-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">{displayName}</h1>
            {profile.username ? (
              <p className="text-text-muted">@{profile.username}</p>
            ) : null}
          </div>
          {isSelf ? (
            <ButtonLink href="/profile/setup" variant="outline" size="sm">
              Edit profile
            </ButtonLink>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <ProfileMessageButton targetUserId={profile.id} />
              <FollowButton targetUserId={profile.id} initialFollowing={following} />
            </div>
          )}
        </div>

        {profile.bio ? (
          <p className="mt-4 leading-relaxed text-text">{profile.bio}</p>
        ) : null}

        {profile.favorite_genres?.length ? (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {profile.favorite_genres.map((genre) => (
              <span
                key={genre}
                className="rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-puce-red"
              >
                {genre}
              </span>
            ))}
          </div>
        ) : null}

        <FollowStats
          profileUserId={profile.id}
          viewerId={user.id}
          profileName={displayName}
          counts={counts}
          className="mt-6"
          size="md"
        />
      </header>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-puce-red">Shelves</h2>
        <ProfileShelfPreview
          ownerId={profile.id}
          username={profile.username}
          isOwnProfile={isSelf}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-puce-red">Recent activity</h2>
        {activity.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-background px-6 py-10 text-center text-sm text-text-muted">
            {isSelf
              ? "Your public activity will show here. Add books and write reviews to share with followers."
              : "No visible activity yet."}
          </p>
        ) : (
          <ul className="space-y-4">
            {activity.map((item) => (
              <li key={item.id}>
                <FeedCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-sm text-text-muted">
        <Link href="/feed" className="text-primary hover:underline">
          ← Back to feed
        </Link>
      </p>
    </div>
  );
}

export default function ReaderPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading reader…" />}>
      <ReaderProfileContent />
    </Suspense>
  );
}
