"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GoalMilestoneNote } from "@/components/reading-room/GoalMilestone";
import { MotionProgressBar } from "@/components/reading-room/MotionProgressBar";
import type { ReadingGoalStatus } from "@/lib/services/readingGoal";
import { OVERVIEW_SECTION_TITLES } from "@bookmarked/utils/overviewCopy";
import { readingGoalPercentLabel, readingGoalSummary } from "@bookmarked/utils/overviewShelfPreview";
import {
  goalBarFillPercent,
  observeGoalProgress,
  readingGoalRealPercent,
  type GoalMilestone,
  type GoalObserveState,
} from "@bookmarked/utils/readingRoomMotion";

type Props = {
  status: ReadingGoalStatus;
  /** False while cached data is showing, before the first network result. */
  dataSettled: boolean;
};

export function ReadingGoalCard({ status, dataSettled }: Props) {
  const real = readingGoalRealPercent(status.completed, status.target);
  const percent = readingGoalPercentLabel(real);
  const observe = useRef<GoalObserveState>({ settled: false, baseline: null });
  const [celebration, setCelebration] = useState<{ id: number; milestone: GoalMilestone } | null>(
    null
  );
  const [glow, setGlow] = useState(false);

  useEffect(() => {
    const result = observeGoalProgress(observe.current, real, dataSettled);
    observe.current = result.state;
    if (result.milestone == null) return;
    setCelebration({ id: Date.now(), milestone: result.milestone });
    setGlow(true);
    const timer = window.setTimeout(() => setGlow(false), 900);
    return () => window.clearTimeout(timer);
  }, [dataSettled, real]);

  return (
    <section
      className={`rounded-2xl border border-border bg-surface/90 p-4 shadow-sm md:p-5 ${glow ? "rr-goal-glow" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-xl text-puce-red">{OVERVIEW_SECTION_TITLES.readingGoal}</h2>
          <p className="mt-1 text-sm text-text-muted">
            {readingGoalSummary(status.completed, status.target)}
          </p>
        </div>
        {percent ? (
          <p className="text-lg font-semibold tabular-nums text-primary">{percent}</p>
        ) : (
          <Link
            href="/reading-room/?tab=stats"
            className="shrink-0 text-sm font-semibold text-primary hover:underline"
          >
            Set goal
          </Link>
        )}
      </div>
      {real != null ? (
        <div
          className="mt-3"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(goalBarFillPercent(real))}
          aria-valuetext={percent ?? undefined}
          aria-label={`Reading goal, ${percent}`}
        >
          <MotionProgressBar value={real} />
        </div>
      ) : null}
      <GoalMilestoneNote eventId={celebration?.id ?? 0} milestone={celebration?.milestone ?? null} />
    </section>
  );
}
