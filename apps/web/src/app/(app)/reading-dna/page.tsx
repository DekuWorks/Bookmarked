"use client";

import { useEffect, useState } from "react";
import { ReadingDnaDashboard } from "@/components/reading-dna/ReadingDnaDashboard";
import { BackNav } from "@/components/ui/BackNav";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { layout } from "@/lib/constants/layout";
import {
  loadDnaBookMatches,
  loadReadingDnaBundle,
  loadReadingDnaComparisons,
  loadSimilarReaders,
  persistReadingDnaSnapshot,
  saveReadingDnaPrivacy,
  type ReadingDnaSimilarReader,
} from "@/lib/services/readingDna";
import { ShareContentModal } from "@/components/social/ShareContentModal";
import { buildReadingDnaShareComposerPayload } from "@bookmarked/utils/sharePreview";
import { getProfile } from "@/lib/services/profile";
import { DEFAULT_READING_DNA_PRIVACY, type ReadingDnaPrivacyState } from "@bookmarked/utils/readingDnaPrivacy";
import type { ReadingDnaSnapshotCompareRow } from "@bookmarked/utils/readingDnaCompare";
import type { ReadingDnaBookMatch } from "@bookmarked/utils/readingDnaRecs";
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
  const [privacy, setPrivacy] = useState<ReadingDnaPrivacyState>(DEFAULT_READING_DNA_PRIVACY);
  const [metrics, setMetrics] = useState<ReadingDnaMetrics>({});
  const [yoy, setYoy] = useState<ReadingDnaSnapshotCompareRow[]>([]);
  const [mom, setMom] = useState<ReadingDnaSnapshotCompareRow[]>([]);
  const [bookMatches, setBookMatches] = useState<ReadingDnaBookMatch[]>([]);
  const [similarReaders, setSimilarReaders] = useState<ReadingDnaSimilarReader[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [displayName, setDisplayName] = useState("Reader");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
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
        const bundle = await loadReadingDnaBundle(user.id, profile?.favorite_genres ?? []);
        if (cancelled) return;

        const computed = bundle.dna;
        const booksRead = books.filter((row) => row.shelf_status === "read").length;
        const streak = computeReadingStreak(streakTimestamps);
        const daysRead = new Set(
          streakTimestamps.map((ts) => ts.slice(0, 10)).filter(Boolean)
        ).size;

        setDna(computed);
        setPrivacy(bundle.privacy);
        setDisplayName(profile?.display_name ?? profile?.username ?? "Reader");
        setAvatarUrl(profile?.avatar_url ?? null);
        setMetrics({
          booksRead,
          daysRead,
          streakDays: streak.current,
        });

        if (!bundle.fromCache) {
          void persistReadingDnaSnapshot(user.id, computed);
        }

        const extras = await Promise.all([
          canAccess("reading_dna_year_comparison")
            ? loadReadingDnaComparisons(user.id)
            : Promise.resolve({ yoy: [], mom: [] }),
          canAccess("reading_dna_book_matches")
            ? loadDnaBookMatches(user.id, computed)
            : Promise.resolve([] as ReadingDnaBookMatch[]),
          canAccess("reading_dna_match")
            ? loadSimilarReaders(computed)
            : Promise.resolve([] as ReadingDnaSimilarReader[]),
        ]);
        if (cancelled) return;
        setYoy(extras[0].yoy);
        setMom(extras[0].mom);
        setBookMatches(extras[1]);
        setSimilarReaders(extras[2]);
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
  }, [user, canAccess]);

  if (user === undefined || (user && loading && !dna)) {
    return <LoadingState message="Loading Reading DNA…" />;
  }

  if (!user) return null;

  return (
    <div className={layout.pageStackWide}>
      <p>
        <BackNav label="profile" fallbackHref="/profile/" />
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
          privacy={privacy}
          yoy={yoy}
          mom={canAccess("reading_dna_match") ? mom : []}
          bookMatches={bookMatches}
          similarReaders={similarReaders}
          onSavePrivacy={async (next) => {
            const result = await saveReadingDnaPrivacy(next);
            if (result.ok) setPrivacy(next);
            return result;
          }}
          onShare={() => setShareOpen(true)}
        />
      ) : (
        <p className="text-text-muted">Could not load your Reading DNA. Try again from your profile.</p>
      )}

      <ShareContentModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        currentUserId={user.id}
        payload={
          dna
            ? buildReadingDnaShareComposerPayload({
                userId: user.id,
                displayName,
                avatarUrl,
                summary: dna.summary,
                destinationPath: "/reading-dna/",
              })
            : null
        }
      />
    </div>
  );
}
