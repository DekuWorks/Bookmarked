"use client";

import { useCallback, useEffect, useState } from "react";
import { getProfile } from "@/lib/services/profile";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { FollowStats } from "@/components/social/FollowStats";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { SettingsIcon } from "@/components/icons/SettingsIcon";
import { getFollowCounts, type FollowCounts } from "@/lib/services/follows";
import {
  computeReadingStreak,
  fetchReadingStreakTimestamps,
} from "@/lib/services/readingInsights";
import { ReadingStreakCard } from "@/components/profile/ReadingStreakCard";
import { ProfanityBlur } from "@/components/social/ProfanityBlur";
import { readerProfilePath } from "@/lib/routes/reader";
import type { Profile } from "@/types";
import { PublicPostsSection } from "@/components/profile/PublicPostsSection";
import { cn } from "@/lib/utils/cn";
import { PremiumBadge } from "@/components/premium/PremiumBadge";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { ReadingDnaSection } from "@/components/profile/ReadingDnaSection";
import { PublicReviewsSection } from "@/components/profile/PublicReviewsSection";
import { ProfileClubsSection } from "@/components/profile/ProfileClubsSection";
import { ProfileBadgeCarousel } from "@/components/challenges/ProfileBadgeCarousel";

import { layout } from "@/lib/constants/layout";

type ProfileData = {
  profile: Profile | null;
  email: string;
  followCounts: FollowCounts;
  readingStreak: ReturnType<typeof computeReadingStreak>;
};

export default function ProfilePage() {
  const user = useAuthUser();
  const { isPremium, canAccess } = useSubscription(user?.id);
  const [data, setData] = useState<ProfileData | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user) return;

    const [profile, followCounts, streakTimestamps] = await Promise.all([
      getProfile(user.id),
      getFollowCounts(user.id),
      fetchReadingStreakTimestamps(user.id),
    ]);

    setData({
      profile,
      email: user.email ?? "",
      followCounts,
      readingStreak: computeReadingStreak(streakTimestamps),
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void loadProfile().catch((error) => {
      console.error("[profile] load failed:", error);
    });
  }, [user, loadProfile]);

  if (user === undefined || (user && !data)) {
    return <LoadingState message="Loading profile…" />;
  }

  if (!user || !data) return null;

  const { profile, email, followCounts, readingStreak } = data;

  return (
    <div className={layout.pageStack}>
      <header className={cn(layout.pageHeader, "-mx-4 feed-header-gradient px-4 pb-8 pt-2 sm:-mx-6 sm:px-6")}>
        <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">Profile</h1>
        <p className="mt-1 text-text-muted">{email}</p>
      </header>

      <section className="surface-card p-6">
        <div className="flex flex-col items-center gap-6">
          {profile ? (
            <AvatarUpload
              userId={user.id}
              profile={profile}
              onAvatarChange={(avatarUrl) =>
                setData((current) =>
                  current && current.profile
                    ? { ...current, profile: { ...current.profile, avatar_url: avatarUrl } }
                    : current
                )
              }
            />
          ) : null}
          <div className="w-full text-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <p className="text-2xl font-semibold text-text">
                {profile?.display_name || profile?.username || "Reader"}
              </p>
              {isPremium ? <PremiumBadge /> : null}
            </div>
            {profile?.username ? (
              <p className="text-text-muted">@{profile.username}</p>
            ) : null}
            <FollowStats
              profileUserId={user.id}
              viewerId={user.id}
              profileName={profile?.display_name || profile?.username || "Reader"}
              counts={followCounts}
              className="mt-3"
              align="center"
              size="md"
            />
          </div>
        </div>
        <ReadingStreakCard streak={readingStreak} className="mt-6" />
        <ProfileBadgeCarousel userId={user.id} isOwner />
        <ReadingDnaSection
          userId={user.id}
          favoriteGenres={profile?.favorite_genres ?? []}
          canAccess={canAccess}
        />
        {profile?.bio ? (
          <ProfanityBlur text={profile.bio} className="mt-4">
            <p className="leading-relaxed text-text">{profile.bio}</p>
          </ProfanityBlur>
        ) : null}
        {profile?.favorite_genres?.length ? (
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
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {profile?.username ? (
            <ButtonLink href={readerProfilePath(profile.username)} variant="primary" size="sm">
              Public profile
            </ButtonLink>
          ) : null}
          <ButtonLink
            href="/profile/settings"
            variant="secondary"
            size="sm"
            className="inline-flex items-center gap-2"
          >
            <SettingsIcon />
            Account settings
          </ButtonLink>
          <ButtonLink href="/challenges/" variant="outline" size="sm">
            Challenges
          </ButtonLink>
          <ButtonLink href="/upgrade/" variant="secondary" size="sm">
            {isPremium ? "Membership" : "How to subscribe"}
          </ButtonLink>
          <LogoutButton />
        </div>
      </section>
      <section className="rounded-xl border border-border bg-surface p-6 text-left shadow-sm">
        <h2 className="text-lg font-semibold text-puce-red">Book clubs</h2>
        <p className="mt-1 text-sm text-text-muted">Clubs you belong to.</p>
        <div className="mt-4">
          <ProfileClubsSection
            profileUserId={user.id}
            viewerId={user.id}
            isOwnProfile
          />
        </div>
      </section>
      <PublicPostsSection userId={user.id} viewerId={user.id} />
      <PublicReviewsSection
        userId={user.id}
        readerName={profile?.display_name || profile?.username || "you"}
      />
    </div>
  );
}
