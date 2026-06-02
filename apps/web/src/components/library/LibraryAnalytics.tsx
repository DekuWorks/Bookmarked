import type { LibraryAnalytics } from "@/lib/services/library";
import { cn } from "@/lib/utils/cn";

type Props = {
  analytics: LibraryAnalytics;
  compact?: boolean;
};

function StatCard({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: string | number;
  sub?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-4 shadow-sm",
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-puce-red">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-text-muted">{sub}</p> : null}
    </div>
  );
}

export function LibraryAnalyticsPanel({ analytics, compact = false }: Props) {
  const {
    wantToReadCount,
    readingCount,
    readCount,
    readingAvgPercent,
    booksFinishedThisMonth,
    pagesRead,
    averageRating,
    readingStreak,
  } = analytics;

  return (
    <section className={cn("space-y-4", compact && "space-y-3")}>
      {!compact ? (
        <h2 className="text-lg font-semibold text-puce-red">Reading insights</h2>
      ) : null}
      <div
        className={cn(
          "grid gap-3",
          compact ? "grid-cols-2 sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"
        )}
      >
        <StatCard label="Want to read" value={wantToReadCount} sub="On your TBR shelf" />
        <StatCard
          label="Reading"
          value={readingCount}
          sub={
            readingCount > 0
              ? `${Math.round(readingAvgPercent)}% avg progress`
              : "Nothing active"
          }
        />
        <StatCard label="Read" value={readCount} sub="Completed books" />
        <StatCard
          label="This month"
          value={booksFinishedThisMonth}
          sub="Books finished"
        />
        {!compact ? (
          <>
            <StatCard
              label="Pages read"
              value={pagesRead.toLocaleString()}
              sub="Across all shelves"
            />
            <StatCard
              label="Avg rating"
              value={averageRating != null ? averageRating.toFixed(1) : "—"}
              sub="Books you've rated"
            />
            <StatCard
              label="Reading streak"
              value={readingStreak > 0 ? `${readingStreak}d` : "—"}
              sub="Consecutive finish days"
            />
            <StatCard
              label="Total library"
              value={wantToReadCount + readingCount + readCount}
              sub="Books collected"
            />
          </>
        ) : null}
      </div>
    </section>
  );
}
