import Link from "next/link";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { ReadingGoalStatus } from "@/lib/services/readingGoal";
import { OVERVIEW_SECTION_TITLES } from "@bookmarked/utils/overviewCopy";
import {
  readingGoalPercentLabel,
  readingGoalSummary,
} from "@bookmarked/utils/overviewShelfPreview";

type Props = {
  status: ReadingGoalStatus;
};

export function ReadingGoalCard({ status }: Props) {
  const percent = readingGoalPercentLabel(status.percent);

  return (
    <section className="rounded-2xl border border-border bg-surface/90 px-5 py-4 shadow-sm">
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
      {status.percent != null ? (
        <div
          className="mt-3"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(status.percent)}
          aria-label={`Reading goal, ${percent}`}
        >
          <ProgressBar value={status.percent} />
        </div>
      ) : null}
    </section>
  );
}
