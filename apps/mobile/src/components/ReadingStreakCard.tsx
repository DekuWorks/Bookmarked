import { Text, View } from "react-native";
import type { ReadingStreakInsight } from "../services/readingInsights";

type Props = {
  streak: ReadingStreakInsight;
};

function formatDays(days: number): string {
  if (days === 1) return "1 day";
  return `${days} days`;
}

export function ReadingStreakCard({ streak }: Props) {
  return (
    <View>
      <View className="flex-row gap-2">
        <StatCell value={streak.current} label="Current streak" highlight />
        <StatCell value={streak.longest} label="Longest streak" />
        <StatCell value={streak.activeDays} label="Active days" />
      </View>
      <Text className="mt-2 text-center text-xs text-ink-muted">
        {streak.current > 0
          ? `On a ${formatDays(streak.current)} reading streak — keep it up!`
          : "Read or review today to start a streak."}
      </Text>
    </View>
  );
}

function StatCell({
  value,
  label,
  highlight,
}: {
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <View
      className={`flex-1 rounded-xl px-2 py-3 ${
        highlight ? "bg-primary/15" : "bg-background"
      }`}
    >
      <Text className="text-center text-2xl font-bold text-puce-red">{value}</Text>
      <Text className="text-center text-[11px] text-ink-muted">{label}</Text>
    </View>
  );
}
