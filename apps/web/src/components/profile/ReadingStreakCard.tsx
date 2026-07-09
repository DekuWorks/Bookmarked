"use client";

import type { ReadingStreakInsight } from "@/lib/services/readingInsights";

type Props = {
  streak: ReadingStreakInsight;
  className?: string;
};

function formatDays(days: number): string {
  if (days === 1) return "1 day";
  return `${days} days`;
}

export function ReadingStreakCard({ streak, className }: Props) {
  return (
    <div className={className}>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-primary/15 px-2 py-3">
          <p className="text-2xl font-bold text-puce-red">{streak.current}</p>
          <p className="text-xs text-text-muted">Current streak</p>
        </div>
        <div className="rounded-lg bg-background px-2 py-3">
          <p className="text-2xl font-bold text-puce-red">{streak.longest}</p>
          <p className="text-xs text-text-muted">Longest streak</p>
        </div>
        <div className="rounded-lg bg-background px-2 py-3">
          <p className="text-2xl font-bold text-puce-red">{streak.activeDays}</p>
          <p className="text-xs text-text-muted">Active days</p>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-text-muted">
        {streak.current > 0
          ? `You're on a ${formatDays(streak.current)} reading streak — keep it up!`
          : "Read or review today to start a streak."}
      </p>
    </div>
  );
}
