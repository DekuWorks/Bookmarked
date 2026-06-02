import type { ShelfStats } from "@/lib/services/library";
import type { ShelfStatus } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  stats: ShelfStats;
  status: ShelfStatus;
};

export function ShelfStatsPanel({ stats, status }: Props) {
  const { totalBooks, averageProgress, averageRating, pagesRead, finishedThisMonth } = stats;

  const cards = [
    { label: "Total books", value: totalBooks },
    ...(status === "currently_reading"
      ? [{ label: "Avg progress", value: `${Math.round(averageProgress)}%` }]
      : []),
    ...(status === "read"
      ? [
          { label: "Finished this month", value: finishedThisMonth },
          { label: "Avg rating", value: averageRating != null ? averageRating.toFixed(1) : "—" },
        ]
      : []),
    { label: "Pages logged", value: pagesRead.toLocaleString() },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={cn("rounded-xl border border-border bg-surface p-4 shadow-sm")}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {card.label}
          </p>
          <p className="mt-1 text-2xl font-bold text-puce-red">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
