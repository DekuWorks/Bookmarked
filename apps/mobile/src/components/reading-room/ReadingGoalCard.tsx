import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { ProgressBar } from "../ProgressBar";
import { ReadingGoalPanel } from "../ReadingGoalPanel";
import type { ReadingGoalStatus } from "../../services/readingGoal";
import { OVERVIEW_SECTION_TITLES } from "../../../../../packages/utils/overviewCopy";
import { readingGoalPercentLabel, readingGoalSummary } from "../../../../../packages/utils/overviewShelfPreview";
import {
  goalBarFillPercent,
  observeGoalProgress,
  READING_ROOM_MOTION,
  readingGoalRealPercent,
  type GoalObserveState,
} from "../../../../../packages/utils/readingRoomMotion";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

type Props = {
  status: ReadingGoalStatus;
  dataSettled: boolean;
  focusGeneration: number;
};

export function ReadingGoalCard({ status, dataSettled, focusGeneration }: Props) {
  const reducedMotion = usePrefersReducedMotion();
  const real = readingGoalRealPercent(status.completed, status.target);
  const percent = readingGoalPercentLabel(real);
  const observe = useRef<GoalObserveState>({ settled: false, baseline: null });
  const focusSeen = useRef(focusGeneration);
  const [live, setLive] = useState("");
  const [visible, setVisible] = useState(false);
  const [glow, setGlow] = useState(false);

  useEffect(() => {
    if (focusSeen.current !== focusGeneration) {
      focusSeen.current = focusGeneration;
      observe.current = { settled: false, baseline: null };
    }
    const result = observeGoalProgress(observe.current, real, dataSettled);
    observe.current = result.state;
    if (result.milestone == null) return;
    setLive(`Goal milestone reached, ${result.milestone} percent.`);
    setVisible(true);
    setGlow(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setGlow(false);
    }, reducedMotion ? READING_ROOM_MOTION.milestoneMs : READING_ROOM_MOTION.milestoneMs);
    return () => clearTimeout(timer);
  }, [dataSettled, focusGeneration, real, reducedMotion]);

  return (
    <View
      className="rounded-2xl border border-brand-border bg-surface px-4 py-3"
      style={
        glow && !reducedMotion
          ? { borderColor: "#B89DBB", shadowColor: "#B89DBB", shadowOpacity: 0.35, shadowRadius: 8 }
          : glow
            ? { borderColor: "#B89DBB" }
            : undefined
      }
    >
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
        ) : null}
      </View>
      {real != null ? (
        <View
          className="mt-3"
          accessibilityRole="progressbar"
          accessibilityLabel={`Reading goal, ${percent}`}
          accessibilityValue={{ min: 0, max: 100, now: Math.round(goalBarFillPercent(real)) }}
        >
          <ProgressBar percent={real} animate />
        </View>
      ) : null}
      <Text
        accessibilityLiveRegion="polite"
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}
      >
        {live}
      </Text>
      {visible ? (
        <Text className="mt-2 text-sm font-semibold text-puce-red">
          {reducedMotion ? "Goal milestone reached" : "Goal milestone reached ✦"}
        </Text>
      ) : null}
      <View className="mt-3">
        <ReadingGoalPanel status={status} showProgress={false} />
      </View>
    </View>
  );
}
