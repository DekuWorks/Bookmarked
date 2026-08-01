"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ReadingDnaDashboard } from "@/components/reading-dna/ReadingDnaDashboard";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { layout } from "@/lib/constants/layout";
import { getProfile } from "@/lib/services/profile";
import {
  loadComputedReadingDna,
  persistReadingDnaSnapshot,
} from "@/lib/services/readingDna";
import {
  computeReadingStreak,
  fetchReadingStreakTimestamps,
} from "@/lib/services/readingInsights";
import { getUserLibraryBooks } from "@/lib/services/library";
import { staticRedirect } from "@/lib/navigation/staticRedirect";
import type { ReadingDna } from "@bookmarked/utils/readingDna";
import type { ReadingDnaMetrics } from "@/components/reading-dna/ReadingDnaDashboard";

export default function ReadingDnaPage() {
  const user = useAuthUser();
  const { canAccess } = useSubscription(user?.id);
  const [dna, setDna] = useState<ReadingDna | null>(null);
  const [metrics, setMetrics] = useState<ReadingDnaMetrics>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user === null) {
      staticRedirect("/login/?redirect=%2Freading-dna%2F");
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const [profile, books, streakTimestamps] = await Promise.all([
          getProfile(user.id),
          getUserLibraryBooks(user.id),
          fetchReadingStreakTimestamps(user.id),
        ]);
        const computed = await loadComputedReadingDna(
          user.id,
          profile?.favorite_genres ?? []
        );
        if (cancelled) return;

        const booksRead = books.filter((row) => row.shelf_status === "read").length;
        const streak = computeReadingStreak(streakTimestamps);
        const daysRead = new Set(
          streakTimestamps.map((ts) => ts.slice(0, 10)).filter(Boolean)
        ).size;

        setDna(computed);
        setMetrics({
          booksRead,
          daysRead,
          streakDays: streak.current,
        });

        void persistReadingDnaSnapshot(user.id, computed);
      } catch (error) {
        console.error("[reading-dna] load failed:", error);
        if (!cancelled) setDna(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (user === undefined || (user && loading && !dna)) {
    return <LoadingState message="Loading Reading DNA…" />;
  }

  if (!user) return null;

  return (
    <div className={layout.pageStackWide}>
      <p>
        <Link href="/profile/" className="text-sm font-medium text-primary hover:underline">
          ← Back to profile
        </Link>
      </p>

      {dna ? (
        <ReadingDnaDashboard
          dna={dna}
          loading={loading}
          metrics={metrics}
          hasPlus={canAccess("full_reading_dna")}
          hasAi={canAccess("reading_dna_ai_insights")}
          hasMatches={canAccess("reading_dna_book_matches")}
          hasHome={canAccess("reading_dna_match")}
        />
      ) : (
        <p className="text-text-muted">Could not load your Reading DNA. Try again from your profile.</p>
      )}
    </div>
  );
}
