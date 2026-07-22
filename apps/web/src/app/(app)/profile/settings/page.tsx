"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PremiumBadge } from "@/components/premium/PremiumBadge";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { useCallback, useEffect, useState } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { LanguagePreferencePanel } from "@/components/profile/LanguagePreferencePanel";
import { LibraryImportPanel } from "@/components/profile/LibraryImportPanel";
import { ShelfPrivacyPanel } from "@/components/profile/ShelfPrivacyPanel";
import { NotificationPreferencesPanel } from "@/components/notifications/NotificationPreferencesPanel";
import { ReadingGoalPanel } from "@/components/reading-goal/ReadingGoalPanel";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { getUserLibraryBooks } from "@/lib/services/library";
import { getProfile } from "@/lib/services/profile";
import { computeReadingGoal } from "@/lib/services/readingGoal";
import type { ReadingGoalStatus } from "@/lib/services/readingGoal";
import type { Profile } from "@/types";
import { layout } from "@/lib/constants/layout";

type SettingsData = {
  profile: Profile;
  readingGoal: ReadingGoalStatus;
};

export default function ProfileSettingsPage() {
  const user = useAuthUser();
  const { isPremium } = useSubscription(user?.id);
  const [data, setData] = useState<SettingsData | null>(null);

  const loadSettings = useCallback(async () => {
    if (!user) return;

    const [profile, books] = await Promise.all([
      getProfile(user.id),
      getUserLibraryBooks(user.id),
    ]);

    if (!profile) return;

    setData({
      profile,
      readingGoal: computeReadingGoal(books, profile.yearly_reading_goal ?? null),
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void loadSettings().catch((error) => {
      console.error("[profile/settings] load failed:", error);
    });
  }, [user, loadSettings]);

  if (user === undefined || (user && !data)) {
    return <LoadingState message="Loading settings…" />;
  }

  if (!user || !data) return null;

  const { profile, readingGoal } = data;

  return (
    <div className={`${layout.pageStack} text-left`}>
      <Link
        href="/profile"
        className="inline-block text-sm font-medium text-primary hover:underline"
      >
        ← Back to profile
      </Link>

      <header className={layout.pageHeader}>
        <h1 className="mt-2 text-3xl font-bold text-puce-red sm:text-4xl">Account settings</h1>
        <p className="mt-1 text-text-muted">
          Notifications, reading goal, language, library import, and shelf privacy.
        </p>
      </header>

      <div className="space-y-6">
        <section className="surface-card p-6">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h2 className="text-lg font-semibold text-puce-red">Bookmarked Premium</h2>
                {isPremium ? <PremiumBadge compact /> : null}
              </div>
              <p className="mt-1 text-sm text-text-muted">
                {isPremium
                  ? "Your subscription is active. Premium features are unlocked."
                  : "Unlock advanced analytics, AI insights, and early access."}
              </p>
            </div>
            <ButtonLink href="/upgrade/" variant={isPremium ? "outline" : "primary"} size="sm">
              {isPremium ? "View plan" : "Upgrade"}
            </ButtonLink>
          </div>
        </section>

        <section className="surface-card p-6">
          <ReadingGoalPanel
            status={readingGoal}
            onSaved={() => void loadSettings()}
          />
        </section>

        <section className="surface-card p-6">
          <NotificationPreferencesPanel profile={profile} embedded />
        </section>

        <section className="surface-card p-6">
          <LanguagePreferencePanel
            profile={profile}
            embedded
            onLanguageChange={(preferred_language) =>
              setData((current) =>
                current
                  ? { ...current, profile: { ...current.profile, preferred_language } }
                  : current
              )
            }
          />
        </section>

        <section className="surface-card p-6">
          <LibraryImportPanel userId={user.id} embedded />
        </section>

        <section className="surface-card p-6">
          <ShelfPrivacyPanel profile={profile} />
        </section>

        <section className="surface-card p-6 text-center">
          <LogoutButton />
        </section>
      </div>
    </div>
  );
}
