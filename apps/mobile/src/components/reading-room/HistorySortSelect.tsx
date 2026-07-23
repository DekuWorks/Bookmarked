import { Pressable, Text, View } from "react-native";
import {
  HISTORY_SORT_OPTIONS,
  type HistorySortMode,
} from "../../../../../packages/utils/readingRoomHistory";

type Props = {
  value: HistorySortMode;
  onChange: (mode: HistorySortMode) => void;
};

export function HistorySortSelect({ value, onChange }: Props) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Sort finished books">
      <Text className="mb-2 text-xs font-medium text-ink-muted">Sort by</Text>
      <View className="flex-row flex-wrap gap-2">
        {HISTORY_SORT_OPTIONS.map((option) => {
          const active = value === option.mode;
          return (
            <Pressable
              key={option.mode}
              onPress={() => onChange(option.mode)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              className={`rounded-full border px-3 py-1.5 ${
                active ? "border-puce-red bg-puce-red" : "border-brand-border bg-background"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${active ? "text-white" : "text-ink-muted"}`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
