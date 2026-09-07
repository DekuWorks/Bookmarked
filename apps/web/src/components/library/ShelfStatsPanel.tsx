import {
  SHELF_STAT_CARD_WIDTH_PX,
  buildShelfStatCards,
  type ShelfStatCard,
  type ShelfStatKind,
  type ShelfStats,
} from "@bookmarked/utils/shelfStats";
import { cn } from "@/lib/utils/cn";

type Props = {
  stats: ShelfStats;
  status: ShelfStatKind;
  cards?: ShelfStatCard[];
};

export function ShelfStatsPanel({ stats, status, cards }: Props) {
  const displayCards = cards ?? buildShelfStatCards(stats, status);

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {displayCards.map((card) => (
        <div
          key={card.label}
          className={cn(
            "shrink-0 rounded-xl border border-border bg-surface p-4 text-left shadow-sm"
          )}
          style={{ width: SHELF_STAT_CARD_WIDTH_PX }}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{card.label}</p>
          <p className="mt-1 text-2xl font-bold leading-tight text-puce-red">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
