import { Text, View } from "react-native";
import {
  SHELF_STAT_CARD_WIDTH_PX,
  buildShelfStatCards,
  type ShelfStatKind,
  type ShelfStats,
} from "../../../../../packages/utils/shelfStats";

type Props = {
  stats: ShelfStats;
  status: ShelfStatKind;
};

export function ShelfStatsRow({ stats, status }: Props) {
  const cards = buildShelfStatCards(stats, status);

  return (
    <View className="flex-row flex-wrap justify-center gap-3">
      {cards.map((card) => (
        <View
          key={card.label}
          className="rounded-xl border border-brand-border bg-surface p-4"
          style={{ width: SHELF_STAT_CARD_WIDTH_PX }}
        >
          <Text className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            {card.label}
          </Text>
          <Text className="mt-1 text-2xl font-bold leading-7 text-puce-red">{card.value}</Text>
        </View>
      ))}
    </View>
  );
}
