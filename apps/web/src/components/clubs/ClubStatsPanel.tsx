"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/LoadingState";
import { getClubStats } from "@/lib/services/bookClubs";
import { canViewDetailedStats } from "@bookmarked/utils/clubPermissions";
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
  const detailed = canViewDetailedStats(viewerRole);
  const [stats, setStats] = useState<BookClubStats | null | undefined>(undefined);
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
          ? "Detailed engagement for hosts and owners."
          : "Snapshot of club activity."}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Members" value={stats.total_members || memberCount} />
        <StatCard label="Active members" value={stats.active_members} />
        <StatCard label="Discussions" value={stats.discussions_created} />
        <StatCard label="Replies" value={stats.replies_posted} />
        {detailed ? (
          <>
            <StatCard label="Events" value={stats.events_created} />
            <StatCard label="RSVPs (going)" value={stats.rsvp_participation} />
            <StatCard label="Books completed" value={stats.books_completed} />
            <StatCard label="Growth (30d)" value={stats.member_growth_30d} />
          </>
        ) : null}
      </dl>
    </section>
  );
}
