"use client";

import { useEffect, useState } from "react";
import { READING_ROOM_MOTION, type GoalMilestone } from "@bookmarked/utils/readingRoomMotion";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

type Props = {
  eventId: number;
  milestone: GoalMilestone | null;
};

const SPARKS = [
  { left: "18%", color: "#B89DBB" },
  { left: "38%", color: "#C9B4CC" },
  { left: "58%", color: "#9A7BA0" },
  { left: "74%", color: "#D4C0D7" },
] as const;

/** Brief lavender note beside the goal. Not a full-screen celebration. */
export function GoalMilestoneNote({ eventId, milestone }: Props) {
  const reducedMotion = usePrefersReducedMotion();
  const [hiddenId, setHiddenId] = useState(0);
  const message =
    milestone != null && eventId !== 0 ? `Goal milestone reached, ${milestone} percent.` : "";
  const visible = message !== "" && hiddenId !== eventId;

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setHiddenId(eventId), READING_ROOM_MOTION.milestoneMs);
    return () => window.clearTimeout(timer);
  }, [eventId, visible]);

  return (
    <div className="relative">
      <p className="sr-only" aria-live="polite">
        {message}
      </p>
      {visible ? (
        <p className="mt-2 text-sm font-semibold text-puce-red">Goal milestone reached</p>
      ) : null}
      {visible && !reducedMotion
        ? SPARKS.map((spark) => (
            <span
              key={spark.left}
              aria-hidden
              className="rr-goal-spark pointer-events-none absolute top-0 text-xs"
              style={{ left: spark.left, color: spark.color }}
            >
              ✦
            </span>
          ))
        : null}
    </div>
  );
}
