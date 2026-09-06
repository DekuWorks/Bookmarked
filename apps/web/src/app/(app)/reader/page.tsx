"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FollowButton } from "@/components/social/FollowButton";
import { ProfileMessageButton } from "@/components/messages/ProfileMessageButton";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { getFollowCounts, isFollowing, type FollowCounts } from "@/lib/services/follows";
import { getProfileByUsername } from "@/lib/services/profile";
import type { Profile } from "@/types";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProfileShelfPreview } from "@/components/profile/ProfileShelfPreview";
import { ProfanityBlur } from "@/components/social/ProfanityBlur";
import { ContentActionsMenu } from "@/components/moderation/ContentActionsMenu";
import { FollowStats } from "@/components/social/FollowStats";
import {
  computeReadingStreak,
  fetchReadingStreakTimestamps,
} from "@/lib/services/readingInsights";
import { ReadingStreakCard } from "@/components/profile/ReadingStreakCard";
import { readerLibraryPath } from "@/lib/routes/readerLibrary";
import { ShareHead } from "@/components/seo/ShareHead";
import { OriginBackNav } from "@/components/navigation/OriginBackNav";
import { PublicReviewsSection } from "@/components/profile/PublicReviewsSection";
import { PublicPostsSection } from "@/components/profile/PublicPostsSection";
import { ProfileClubsSection } from "@/components/profile/ProfileClubsSection";
import { CopyLinkButton } from "@/components/ui/CopyLinkButton";
import { PostNotificationButton } from "@/components/social/PostNotificationButton";
import { readerProfilePath } from "@/lib/routes/reader";

type ReaderData = {
  profile: Profile;
  counts: FollowCounts;
  following: boolean;
  readingStreak: ReturnType<typeof computeReadingStreak>;
};

function ReaderProfileContent() {
  const searchParams = useSearchParams();
  const username = searchParams.get("username")?.trim() ?? "";
  const user = useAuthUser();
  const [data, setData] = useState<ReaderData | null | undefined>(undefined);
  const [following, setFollowing] = useState(false);

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

      const [counts, isFollowingUser, streakTimestamps] = await Promise.all([
        getFollowCounts(profile.id),
        user.id === profile.id ? Promise.resolve(false) : isFollowing(user.id, profile.id),
        fetchReadingStreakTimestamps(profile.id),
      ]);

      setData({
        profile,
        counts,
        following: isFollowingUser,
        readingStreak: computeReadingStreak(streakTimestamps),
      });
      setFollowing(isFollowingUser);
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

  const { profile, counts, readingStreak } = data;
  const isSelf = user.id === profile.id;
  const displayName = profile.display_name?.trim() || profile.username || "Reader";
  const libraryHref = profile.username ? readerLibraryPath(profile.username) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-8 text-center">
      <ShareHead
        title={displayName}
        description={profile.bio?.trim() || `${displayName} on Bookmarked`}
        image={profile.avatar_url}
      />
      <header className="rounded-xl border border-border bg-surface p-6 text-center shadow-sm">
        <div className="flex flex-col items-center justify-center gap-4">
          <ProfileAvatar profile={profile} size="xl" />
          <div>
            <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">{displayName}</h1>
            {profile.username ? (
              <p className="text-text-muted">@{profile.username}</p>
            ) : null}
          </div>
          {isSelf ? (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <CopyLinkButton
                path={readerProfilePath(profile.username ?? username)}
                label="Copy profile link"
                variant="outline"
              />
              <ButtonLink href="/profile/setup" variant="outline" size="sm">
                Edit profile
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <ProfileMessageButton targetUserId={profile.id} />
              <FollowButton
                targetUserId={profile.id}
                initialFollowing={following}
                onChange={setFollowing}
              />
              {following ? (
                <PostNotificationButton subscriberId={user.id} creatorId={profile.id} />
              ) : null}
              <ContentActionsMenu
                contentType="profile"
                contentId={profile.id}
                reportedUserId={profile.id}
                reportedUserName={displayName}
              />
            </div>
          )}
        </div>

        {profile.bio ? (
          <ProfanityBlur
            text={profile.bio}
            meta={profile.moderation_meta ?? null}
            className="mt-4"
          >
            <p className="leading-relaxed text-text">{profile.bio}</p>
          </ProfanityBlur>
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
        <ReadingStreakCard streak={readingStreak} className="mt-6" />
      </header>

      <section className="rounded-xl border border-border bg-surface p-6 text-left shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-puce-red">Shelves</h2>
          {libraryHref && !isSelf ? (
            <Link href={libraryHref} className="text-sm font-medium text-primary hover:underline">
              View full library
            </Link>
          ) : null}
        </div>
        <ProfileShelfPreview
          ownerId={profile.id}
          username={profile.username}
          isOwnProfile={isSelf}
          previewLimit={3}
        />
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 text-left shadow-sm">
        <h2 className="text-lg font-semibold text-puce-red">Book clubs</h2>
        <p className="mt-1 text-sm text-text-muted">Clubs {displayName} belongs to.</p>
        <div className="mt-4">
          <ProfileClubsSection
            profileUserId={profile.id}
            viewerId={user.id}
            isOwnProfile={isSelf}
          />
        </div>
      </section>

      <PublicPostsSection userId={profile.id} viewerId={user.id} />
      <PublicReviewsSection userId={profile.id} readerName={displayName} />

      <p className="text-center">
        <OriginBackNav fallbackLabel="feed" fallbackHref="/feed/" />
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
