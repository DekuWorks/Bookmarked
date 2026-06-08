import { cn } from "@/lib/utils/cn";
import type { ReadingAnalytics } from "@/lib/services/analytics";

type Stat = {
  label: string;
  value: string | number;
  comingSoon?: boolean;
};

type Props = {
  analytics: ReadingAnalytics;
  showFuturePlaceholders?: boolean;
  className?: string;
  compact?: boolean;
};

export function AnalyticsGrid({
  analytics,
  showFuturePlaceholders = false,
  className,
  compact,
}: Props) {
  const stats: Stat[] = [
    { label: "Books read", value: analytics.booksRead },
    { label: "Currently reading", value: analytics.currentlyReading },
    { label: "Want to read", value: analytics.wantToRead },
    { label: "Pages read", value: analytics.pagesRead.toLocaleString() },
    { label: "Reviews written", value: analytics.reviewsWritten },
    {
      label: "Avg. rating given",
      value:
        analytics.averageRatingGiven != null
          ? analytics.averageRatingGiven.toFixed(1)
          : "—",
    },
  ];

  const future: Stat[] = showFuturePlaceholders
    ? [
        { label: "Reading streak", value: "—", comingSoon: true },
        { label: "Favorite genre", value: "—", comingSoon: true },
        { label: "Reading goal", value: "—", comingSoon: true },
      ]
    : [];

  const all = [...stats, ...future];

  return (
    <dl
      className={cn(
        "grid gap-3",
        compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
        className
      )}
    >
      {all.map((s) => (
        <div
          key={s.label}
          className={cn(
            "rounded-xl border border-border bg-surface px-3 py-3 shadow-sm transition hover:shadow-md",
            s.comingSoon && "border-dashed opacity-80"
          )}
        >
          <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {s.label}
            {s.comingSoon ? (
              <span className="ml-1 normal-case text-primary">(soon)</span>
            ) : null}
          </dt>
          <dd className="mt-1 text-2xl font-bold text-puce-red">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
