import { cn } from "@/lib/utils/cn";
import type { ReadingAnalytics } from "@/lib/services/analytics";
import type { ReadingGoalStatus } from "@/lib/services/readingGoal";

type Stat = {
  label: string;
  value: string | number;
  sublabel?: string;
  comingSoon?: boolean;
  valueClassName?: string;
};

type Props = {
  analytics: ReadingAnalytics;
  readingGoal?: ReadingGoalStatus;
  showFuturePlaceholders?: boolean;
  className?: string;
  compact?: boolean;
};

function formatStreak(days: number): string {
  if (days === 0) return "0 days";
  return days === 1 ? "1 day" : `${days} days`;
}

function formatFavoriteGenre(analytics: ReadingAnalytics): Stat {
  const { genre, bookCount, source } = analytics.favoriteGenre;
  if (!genre) {
    return { label: "Favorite genre", value: "—" };
  }
  const sublabel =
    source === "library" && bookCount > 0
      ? `${bookCount} read book${bookCount === 1 ? "" : "s"}`
      : source === "profile"
        ? "From your profile"
        : undefined;

  return {
    label: "Favorite genre",
    value: genre,
    sublabel,
    valueClassName: "text-lg leading-snug line-clamp-2",
  };
}

export function AnalyticsGrid({
  analytics,
  readingGoal,
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
    formatFavoriteGenre(analytics),
    {
      label: "Reading streak",
      value: formatStreak(analytics.readingStreak.current),
      sublabel:
        analytics.readingStreak.longest > 0
          ? `Best: ${formatStreak(analytics.readingStreak.longest)}`
          : undefined,
    },
  ];

  const goalStat: Stat[] =
    readingGoal?.target != null
      ? [
          {
            label: `${readingGoal.year} goal`,
            value: `${readingGoal.completed}/${readingGoal.target}`,
          },
        ]
      : [];

  const future: Stat[] =
    showFuturePlaceholders && readingGoal?.target == null
      ? [{ label: "Reading goal", value: "—", comingSoon: true }]
      : [];

  const all = [...stats, ...goalStat, ...future];

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
          <dd
            className={cn(
              "mt-1 font-bold text-puce-red",
              s.valueClassName ?? "text-2xl"
            )}
          >
            {s.value}
          </dd>
          {s.sublabel ? (
            <p className="mt-0.5 text-xs text-text-muted">{s.sublabel}</p>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
