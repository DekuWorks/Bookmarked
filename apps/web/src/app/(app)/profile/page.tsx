"use client";

import { useCallback, useEffect, useState } from "react";
import { getProfile } from "@/lib/services/profile";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { FollowStats } from "@/components/social/FollowStats";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { LanguagePreferencePanel } from "@/components/profile/LanguagePreferencePanel";
import { NotificationPreferencesPanel } from "@/components/notifications/NotificationPreferencesPanel";
import { LibraryImportPanel } from "@/components/profile/LibraryImportPanel";
import { getFollowCounts, type FollowCounts } from "@/lib/services/follows";
import {
  computeReadingStreak,
  fetchReadingStreakTimestamps,
} from "@/lib/services/readingInsights";
import { ReadingStreakCard } from "@/components/profile/ReadingStreakCard";
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
      <header className={layout.pageHeader}>
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
          <p className="mt-4 leading-relaxed text-text">{profile.bio}</p>
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
          <LogoutButton />
        </div>
      </section>

      {profile ? (
        <details className="group rounded-xl border border-border bg-surface text-left shadow-sm">
          <summary
            className={cn(
              "cursor-pointer list-none p-6 text-center",
              "[&::-webkit-details-marker]:hidden"
            )}
          >
            <span className="text-lg font-semibold text-puce-red">Account settings</span>
            <span className="mt-1 block text-sm text-text-muted group-open:hidden">
              Notifications, language, and library import
            </span>
          </summary>
          <div className="space-y-6 border-t border-border px-6 pb-6 pt-4">
            <NotificationPreferencesPanel profile={profile} embedded />
            <LanguagePreferencePanel
              profile={profile}
              embedded
              onLanguageChange={(preferred_language) =>
                setData((current) =>
                  current && current.profile
                    ? { ...current, profile: { ...current.profile, preferred_language } }
                    : current
                )
              }
            />
            <LibraryImportPanel userId={user.id} embedded />
          </div>
        </details>
      ) : null}
    </div>
  );
}
