import { Pressable, Text, View } from "react-native";
import {
  REVIEW_VISIBILITY_OPTIONS,
  type ReviewAudience,
} from "../../../../packages/utils/reviewVisibility";

type Props = {
  value: ReviewAudience;
  onChange: (value: ReviewAudience) => void;
  disabled?: boolean;
};

export function ReviewVisibilityControl({ value, onChange, disabled = false }: Props) {
  const helper =
    REVIEW_VISIBILITY_OPTIONS.find((option) => option.value === value)?.helper ??
    REVIEW_VISIBILITY_OPTIONS[0].helper;

  return (
    <View>
      <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">
        Visibility
      </Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Review visibility"
        className="flex-row rounded-xl border border-brand-border bg-background p-1"
      >
        {REVIEW_VISIBILITY_OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled }}
              className={`min-h-[40px] flex-1 items-center justify-center rounded-lg px-3 ${
                selected ? "bg-puce-red" : "bg-transparent"
              } ${disabled ? "opacity-60" : "active:opacity-80"}`}
            >
              <Text className={`text-sm font-semibold ${selected ? "text-white" : "text-ink-muted"}`}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text className="mt-2 text-xs text-ink-muted">{helper}</Text>
    </View>
  );
}
