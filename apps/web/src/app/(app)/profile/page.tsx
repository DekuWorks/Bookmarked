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
import { CopyLinkButton } from "@/components/ui/CopyLinkButton";
import type { Profile } from "@/types";
import { layout } from "@/lib/constants/layout";
import { cn } from "@/lib/utils/cn";

type ProfileData = {
  profile: Profile | null;
  email: string;
  followCounts: FollowCounts;
  readingStreak: ReturnType<typeof computeReadingStreak>;
};

export default function ProfilePage() {
  const user = useAuthUser();
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
      <header className={cn(layout.pageHeader, "relative")}>
        <div className="absolute right-0 top-0">
          <ButtonLink
            href="/profile/settings"
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2"
            aria-label="Account settings"
          >
            <SettingsIcon />
            <span className="hidden sm:inline">Settings</span>
          </ButtonLink>
        </div>
        <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">Profile</h1>
        <p className="mt-1 text-text-muted">{email}</p>
      </header>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
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
            <p className="text-2xl font-semibold text-text">
              {profile?.display_name || profile?.username || "Reader"}
            </p>
            {profile?.username ? (
              <p className="text-text-muted">@{profile.username}</p>
            ) : null}
            <FollowStats
              profileUserId={user.id}
              viewerId={user.id}
              profileName={profile?.display_name || profile?.username || "Reader"}
              counts={followCounts}
              className="mt-3"
            />
          </div>
        </div>
        <ReadingStreakCard streak={readingStreak} className="mt-6" />
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
            <>
              <ButtonLink href={readerProfilePath(profile.username)} variant="secondary" size="sm">
                Public profile
              </ButtonLink>
              <CopyLinkButton
                path={readerProfilePath(profile.username)}
                label="Copy profile link"
                variant="outline"
              />
            </>
          ) : null}
          <ButtonLink href="/profile/setup" variant="outline" size="sm">
            Edit profile
          </ButtonLink>
          <ButtonLink
            href="/profile/settings"
            variant="secondary"
            size="sm"
            className="inline-flex items-center gap-2"
          >
            <SettingsIcon />
            Account settings
          </ButtonLink>
          <ButtonLink href="/upgrade/" variant="secondary" size="sm">
            Premium
          </ButtonLink>
          <LogoutButton />
        </div>
      </section>
    </div>
  );
}
