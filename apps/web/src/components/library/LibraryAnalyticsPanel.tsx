"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AnalyticsGrid } from "@/components/analytics/AnalyticsGrid";
import { computeReadingAnalytics } from "@/lib/services/analytics";
import { fetchReadingStreakTimestamps } from "@/lib/services/readingInsights";
import { getProfile } from "@/lib/services/profile";
import type { LibraryBookRow } from "@/lib/services/library";
import type { ReadingAnalytics } from "@/lib/services/analytics";

type Props = {
  books: LibraryBookRow[];
  userId: string;
  showFuturePlaceholders?: boolean;
};

export function LibraryAnalyticsPanel({
  books,
  userId,
  showFuturePlaceholders,
}: Props) {
  const [analytics, setAnalytics] = useState<ReadingAnalytics | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void Promise.all([
      getProfile(userId),
      fetchReadingStreakTimestamps(userId),
      supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
    ])
      .then(([profile, streakTimestamps, reviewResult]) => {
        setAnalytics(
          computeReadingAnalytics({
            books,
            reviewsWritten: reviewResult.count ?? 0,
            streakTimestamps,
            profileGenres: profile?.favorite_genres,
          })
        );
      })
      .catch((error) => {
        console.error("[library] insights load failed:", error);
        setAnalytics(
          computeReadingAnalytics({
            books,
            reviewsWritten: 0,
            streakTimestamps: [],
          })
        );
      });
  }, [books, userId]);

  if (!analytics) {
    return (
      <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-puce-red">Reading insights</h2>
        <p className="mt-2 text-sm text-text-muted">Loading insights…</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-puce-red">Reading insights</h2>
      <AnalyticsGrid
        analytics={analytics}
        showFuturePlaceholders={showFuturePlaceholders}
        className="mt-4"
      />
    </section>
  );
}
