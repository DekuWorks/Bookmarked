import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PRIVATE_REVIEW_BADGE } from "../../../../packages/utils/reviewVisibility";

type Props = {
  compact?: boolean;
};

export function PrivateReviewBadge({ compact = false }: Props) {
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={PRIVATE_REVIEW_BADGE.ariaLabel}
      className="flex-row items-center gap-1 rounded-full border border-brand-border bg-background px-2 py-0.5"
    >
      <Ionicons name="lock-closed-outline" size={compact ? 11 : 12} color="#6B5A6E" />
      <Text className="text-xs font-medium text-ink-muted">{PRIVATE_REVIEW_BADGE.label}</Text>
    </View>
  );
}
