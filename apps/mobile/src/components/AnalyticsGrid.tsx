import { Text, View } from "react-native";
import type { ReadingAnalytics } from "../services/analytics";
import type { ReadingGoalStatus } from "../services/readingGoal";
import { SANS_FONT_BOLD, SANS_FONT_MEDIUM } from "../constants/theme";

type Stat = {
  label: string;
  value: string | number;
  sublabel?: string;
  compactValue?: boolean;
};

type Props = {
  analytics: ReadingAnalytics;
  readingGoal?: ReadingGoalStatus;
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
    compactValue: true,
  };
}

function StatCard({ label, value, sublabel, compactValue }: Stat) {
  return (
    <View className="w-[47%] rounded-xl border border-brand-border bg-surface px-3 py-3 shadow-sm">
      <Text
        className="text-center text-xs uppercase tracking-wide text-ink-muted"
        style={{ fontFamily: SANS_FONT_MEDIUM }}
      >
        {label}
      </Text>
      <Text
        className={`mt-1 text-center font-bold text-puce-red ${compactValue ? "text-lg" : "text-2xl"}`}
        style={{ fontFamily: SANS_FONT_BOLD }}
        numberOfLines={compactValue ? 2 : 1}
      >
        {value}
      </Text>
      {sublabel ? (
        <Text className="mt-0.5 text-center text-xs text-ink-muted">{sublabel}</Text>
      ) : null}
    </View>
  );
}

/** Basic reading stats grid — mirrors web AnalyticsGrid (compact). */
export function AnalyticsGrid({ analytics, readingGoal }: Props) {
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

  return (
    <View className="flex-row flex-wrap gap-3">
      {[...stats, ...goalStat].map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </View>
  );
}
