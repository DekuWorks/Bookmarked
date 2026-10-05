import { Pressable, Text, View } from "react-native";
import { ProgressBar } from "../ProgressBar";
import type { ReadingGoalStatus } from "../../services/readingGoal";
import { OVERVIEW_SECTION_TITLES } from "../../../../../packages/utils/overviewCopy";
import {
  readingGoalPercentLabel,
  readingGoalSummary,
} from "../../../../../packages/utils/overviewShelfPreview";

type Props = {
  status: ReadingGoalStatus;
  onSetGoal?: () => void;
};

export function ReadingGoalCard({ status, onSetGoal }: Props) {
  const percent = readingGoalPercentLabel(status.percent);

  return (
    <View className="rounded-2xl border border-brand-border bg-surface px-4 py-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-xl font-semibold text-puce-red">
            {OVERVIEW_SECTION_TITLES.readingGoal}
          </Text>
          <Text className="mt-1 text-sm text-ink-muted">
            {readingGoalSummary(status.completed, status.target)}
          </Text>
        </View>
        {percent ? (
          <Text className="text-lg font-semibold text-primary">{percent}</Text>
        ) : (
          <Pressable accessibilityRole="button" onPress={onSetGoal} className="min-h-11 justify-center">
            <Text className="text-sm font-semibold text-primary">Set goal</Text>
          </Pressable>
        )}
      </View>
      {status.percent != null ? (
        <View
          className="mt-3"
          accessibilityRole="progressbar"
          accessibilityLabel={`Reading goal, ${percent}`}
        >
          <ProgressBar percent={status.percent} />
        </View>
      ) : null}
    </View>
  );
}
