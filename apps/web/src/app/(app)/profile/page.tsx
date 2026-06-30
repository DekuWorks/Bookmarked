"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getProfile } from "@/lib/services/profile";
import { getUserLibraryBooks } from "@/lib/services/library";
import { computeReadingAnalytics } from "@/lib/services/analytics";
import { fetchReadingStreakTimestamps } from "@/lib/services/readingInsights";
import { computeReadingGoal } from "@/lib/services/readingGoal";
import { ReadingGoalPanel } from "@/components/reading-goal/ReadingGoalPanel";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { AnalyticsGrid } from "@/components/analytics/AnalyticsGrid";
import { BookMiniGrid } from "@/components/reading-room/BookMiniGrid";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useUserBooksRealtime } from "@/lib/hooks/useUserBooksRealtime";
import { FollowStats } from "@/components/social/FollowStats";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { ProfileShelfPreview } from "@/components/profile/ProfileShelfPreview";
import { ShelfPrivacyPanel } from "@/components/profile/ShelfPrivacyPanel";
import { LanguagePreferencePanel } from "@/components/profile/LanguagePreferencePanel";
import { NotificationPreferencesPanel } from "@/components/notifications/NotificationPreferencesPanel";
import { getFollowCounts, type FollowCounts } from "@/lib/services/follows";
import { readerProfilePath } from "@/lib/routes/reader";
import { CopyLinkButton } from "@/components/ui/CopyLinkButton";
import { ProfileNotificationsSection } from "@/components/notifications/ProfileNotificationsSection";
import { ProfileFeedSection } from "@/components/social/ProfileFeedSection";
import type { Profile } from "@/types";
import type { LibraryBookRow } from "@/lib/services/library";
import type { ReadingAnalytics } from "@/lib/services/analytics";
import type { ReadingGoalStatus } from "@/lib/services/readingGoal";

type ProfileData = {
  profile: Profile | null;
  email: string;
  analytics: ReadingAnalytics;
  readingGoal: ReadingGoalStatus;
  recentlyFinished: LibraryBookRow[];
  favorites: LibraryBookRow[];
  followCounts: FollowCounts;
};

import { layout } from "@/lib/constants/layout";

export default function ProfilePage() {
  const user = useAuthUser();
  const [data, setData] = useState<ProfileData | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user) return;

    const supabase = createClient();
    const [profile, books, streakTimestamps, followCounts, reviewResult] = await Promise.all([
      getProfile(user.id),
      getUserLibraryBooks(user.id),
      fetchReadingStreakTimestamps(user.id),
      getFollowCounts(user.id),
      supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

    const analytics = computeReadingAnalytics({
      books,
      reviewsWritten: reviewResult.count ?? 0,
      streakTimestamps,
      profileGenres: profile?.favorite_genres,
    });
    const recentlyFinished = books
      .filter((b) => b.shelf_status === "read")
      .sort((a, b) => {
        const aDate = a.finished_at ? new Date(a.finished_at).getTime() : 0;
        const bDate = b.finished_at ? new Date(b.finished_at).getTime() : 0;
        return bDate - aDate;
      })
      .slice(0, 4);
    const favorites = books.filter((b) => b.is_favorite).slice(0, 4);

    setData({
      profile,
      email: user.email ?? "",
      analytics,
      readingGoal: computeReadingGoal(books, profile?.yearly_reading_goal ?? null),
      recentlyFinished,
      favorites,
      followCounts,
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void loadProfile();
  }, [user, loadProfile]);

  useUserBooksRealtime(user?.id, loadProfile);

  if (user === undefined || (user && !data)) {
    return <LoadingState message="Loading profile…" />;
  }

  if (!user || !data) return null;

  const { profile, email, analytics, readingGoal, recentlyFinished, favorites, followCounts } =
    data;

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
        {profile?.bio ? (
          <p className="mt-4 leading-relaxed text-text">{profile.bio}</p>
        ) : null}
        {profile?.favorite_genres?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
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
        <div className="mt-6 flex flex-wrap gap-3">
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

      <Suspense fallback={<LoadingState message="Loading feed…" />}>
        <ProfileFeedSection
          userId={user.id}
          className="rounded-xl border border-border bg-surface p-6 shadow-sm"
        />
      </Suspense>

      <ProfileNotificationsSection
        userId={user.id}
        className="rounded-xl border border-border bg-surface p-6 shadow-sm"
      />

      {profile ? <ShelfPrivacyPanel profile={profile} /> : null}

      {profile ? (
        <LanguagePreferencePanel
          profile={profile}
          onLanguageChange={(preferred_language) =>
            setData((current) =>
              current && current.profile
                ? { ...current, profile: { ...current.profile, preferred_language } }
                : current
            )
          }
        />
      ) : null}

      {profile ? <NotificationPreferencesPanel profile={profile} /> : null}

      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-puce-red">Shelves</h2>
        <ProfileShelfPreview
          ownerId={user.id}
          username={profile?.username ?? null}
          isOwnProfile
        />
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-puce-red">Reading goal</h2>
        <ReadingGoalPanel status={readingGoal} className="mt-4" />
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-puce-red">Reading statistics</h2>
        <AnalyticsGrid
          analytics={analytics}
          readingGoal={readingGoal}
          className="mt-4"
          compact
        />
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-puce-red">Favorite books</h2>
          <Link href="/reading-room" className="text-sm font-medium text-primary hover:underline">
            Reading Room
          </Link>
        </div>
        <BookMiniGrid
          items={favorites}
          emptyMessage="Mark books as favorites from their detail page."
          emptyAction={{ label: "Browse search", href: "/search" }}
        />
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-puce-red">Recently finished</h2>
        <BookMiniGrid
          items={recentlyFinished}
          emptyMessage="Finished books will show up here."
          emptyAction={{ label: "View read shelf", href: "/library/read" }}
        />
      </section>

      <section className="rounded-xl border border-dashed border-border bg-background p-6 text-center">
        <p className="font-medium text-puce-red">Badges & achievements</p>
        <p className="mt-1 text-sm text-text-muted">Coming in a future update.</p>
      </section>
    </div>
  );
}
