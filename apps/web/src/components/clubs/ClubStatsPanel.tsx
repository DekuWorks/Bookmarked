"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/LoadingState";
import { getClubStats } from "@/lib/services/bookClubs";
import { loadClubAnalytics } from "@/lib/services/clubPolls";
import { canViewClubAnalytics } from "@bookmarked/utils/clubAnalytics";
import { canViewDetailedStats } from "@bookmarked/utils/clubPermissions";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { PremiumFeatureLock } from "@/components/premium/PremiumFeatureLock";
import type { BookClubMemberRole, BookClubStats } from "@/types";

type Props = {
  clubId: string;
  viewerRole: BookClubMemberRole | null;
  memberCount: number;
};

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-background p-4">
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="mt-1 text-2xl font-bold text-puce-red">{value}</dd>
    </div>
  );
}

export function ClubStatsPanel({ clubId, viewerRole, memberCount }: Props) {
  const user = useAuthUser();
  const { canAccess } = useSubscription(user?.id);
  const detailed = canViewClubAnalytics({
    hasPlus: canAccess("club_analytics"),
    role: viewerRole,
  });
  const basicDetailed = canViewDetailedStats(viewerRole);
  const [stats, setStats] = useState<BookClubStats | null | undefined>(undefined);
  const [plusSnapshot, setPlusSnapshot] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStats(undefined);
    setError(null);
    void getClubStats(clubId)
      .then((result) => {
        if (!cancelled) setStats(result);
      })
      .catch((err) => {
        console.error("[club-stats] load failed:", err);
        if (!cancelled) {
          setError("Could not load club stats.");
          setStats(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [clubId]);

  useEffect(() => {
    if (!detailed) {
      setPlusSnapshot(null);
      return;
    }
    void loadClubAnalytics(clubId).then((result) => {
      if ("snapshot" in result && result.snapshot) setPlusSnapshot(result.snapshot);
    });
  }, [clubId, detailed]);

  if (stats === undefined) {
    return <LoadingState message="Loading stats…" />;
  }

  if (error || !stats) {
    return (
      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-puce-red">Club stats</h2>
        <p className="mt-3 text-sm text-rust">{error ?? "Stats unavailable."}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Members" value={memberCount} />
        </dl>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-puce-red">Club stats</h2>
      <p className="mt-1 text-sm text-text-muted">
        {detailed
          ? "Plus club analytics for owners and hosts. Aggregates only — not anyone’s private reading."
          : basicDetailed
            ? "Basic club activity. Plus unlocks owner/host analytics."
            : "Snapshot of club activity."}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Members" value={stats.total_members || memberCount} />
        <StatCard label="Active members" value={stats.active_members} />
        <StatCard label="Discussions" value={stats.discussions_created} />
        <StatCard label="Replies" value={stats.replies_posted} />
        {detailed ? (
          <>
            <StatCard label="Events" value={plusSnapshot?.events ?? stats.events_created} />
            <StatCard label="RSVPs (going)" value={plusSnapshot?.rsvpsGoing ?? stats.rsvp_participation} />
            <StatCard label="Books completed" value={plusSnapshot?.booksCompleted ?? stats.books_completed} />
            <StatCard label="Growth (30d)" value={plusSnapshot?.growth30d ?? stats.member_growth_30d} />
            <StatCard label="Polls" value={plusSnapshot?.pollCount ?? 0} />
            <StatCard label="Poll votes" value={plusSnapshot?.pollVotes ?? 0} />
          </>
        ) : basicDetailed ? (
          <div className="col-span-2 sm:col-span-3">
            <PremiumFeatureLock
              compact
              title="Club analytics"
              description="Owner and host analytics are a Plus feature. Subscribe in the iOS app."
            />
          </div>
        ) : null}
      </dl>
    </section>
  );
}
