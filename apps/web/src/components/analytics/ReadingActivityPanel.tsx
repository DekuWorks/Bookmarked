"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getReadingActivityData,
  getReadingHeatmapData,
  type ReadingActivityData,
} from "@/lib/services/readingActivity";
import type { ReadingPagesByDay } from "@/lib/services/readingSessions";
import { cn } from "@/lib/utils/cn";

type Props = {
  userId: string;
  className?: string;
  showHeatmap?: boolean;
};

function heatmapIntensity(pages: number, max: number): string {
  if (pages <= 0 || max <= 0) return "bg-border/60";
  const ratio = pages / max;
  if (ratio >= 0.75) return "bg-royal-orange";
  if (ratio >= 0.5) return "bg-royal-orange/70";
  if (ratio >= 0.25) return "bg-royal-orange/40";
  return "bg-royal-orange/20";
}

function formatHeatmapTitle(day: string, pages: number): string {
  const date = new Date(`${day}T12:00:00.000Z`);
  const label = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  if (pages <= 0) return `${label}: no reading`;
  return `${label}: ${pages} page${pages === 1 ? "" : "s"}`;
}

export function ReadingActivityPanel({
  userId,
  className,
  showHeatmap = true,
}: Props) {
  const [activity, setActivity] = useState<ReadingActivityData | null>(null);
  const [heatmap, setHeatmap] = useState<ReadingPagesByDay[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [activityData, heatmapData] = await Promise.all([
        getReadingActivityData(userId),
        showHeatmap ? getReadingHeatmapData(userId) : Promise.resolve([]),
      ]);
      setActivity(activityData);
      setHeatmap(heatmapData);
    } finally {
      setLoading(false);
    }
  }, [userId, showHeatmap]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-text-muted">Loading reading activity…</p>;
  }

  if (!activity) return null;

  const maxPages = Math.max(1, ...activity.pagesByDay.map((d) => d.pages_read));
  const heatmapMax = Math.max(1, ...heatmap.map((d) => d.pages_read));
  const hasAnyActivity =
    activity.stats.total_pages > 0 ||
    activity.stats.session_count > 0 ||
    heatmap.some((d) => d.pages_read > 0);

  if (!hasAnyActivity) {
    return (
      <p className="text-sm text-text-muted">
        Log reading progress on your books to see weekly charts here.
      </p>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-background/50 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-puce-red">{activity.stats.total_pages}</p>
          <p className="text-xs text-text-muted">Pages this week</p>
        </div>
        <div className="rounded-lg border border-border bg-background/50 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-puce-red">{activity.stats.active_days}</p>
          <p className="text-xs text-text-muted">Active days</p>
        </div>
        <div className="rounded-lg border border-border bg-background/50 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-puce-red">{activity.stats.session_count}</p>
          <p className="text-xs text-text-muted">Sessions</p>
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-puce-red">Pages per day</p>
        <div className="flex items-end justify-between gap-1 sm:gap-2" role="img" aria-label="Bar chart of pages read per day this week">
          {activity.pagesByDay.map((day, index) => {
            const heightPct = day.pages_read > 0 ? (day.pages_read / maxPages) * 100 : 4;
            return (
              <div key={day.day} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-medium text-text-muted sm:text-xs">
                  {day.pages_read > 0 ? day.pages_read : ""}
                </span>
                <div className="flex h-24 w-full items-end">
                  <div
                    className={cn(
                      "w-full rounded-t-md bg-gradient-to-t from-royal-orange to-orange-yellow transition-all",
                      day.pages_read <= 0 && "from-border to-border"
                    )}
                    style={{ height: `${heightPct}%`, minHeight: day.pages_read > 0 ? "8px" : "4px" }}
                    title={`${activity.weekLabels[index]}: ${day.pages_read} pages`}
                  />
                </div>
                <span className="truncate text-[10px] text-text-muted sm:text-xs">
                  {activity.weekLabels[index]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {showHeatmap && heatmap.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium text-puce-red">Pages heatmap</p>
          <p className="mb-3 text-xs text-text-muted">Last 12 weeks — darker royal orange means more pages. Listening stays separate.</p>
          <div
            className="grid grid-flow-col grid-rows-7 gap-0.5 overflow-x-auto pb-1"
            role="img"
            aria-label="Heatmap of pages read over the last 12 weeks"
          >
            {heatmap.map((day) => (
              <span
                key={day.day}
                title={formatHeatmapTitle(day.day, day.pages_read)}
                aria-label={formatHeatmapTitle(day.day, day.pages_read)}
                className={cn("h-3 w-3 shrink-0 rounded-sm", heatmapIntensity(day.pages_read, heatmapMax))}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
