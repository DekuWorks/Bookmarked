import { Text, View } from "react-native";

type Props = {
  compact?: boolean;
  label?: "Plus" | "Premium" | "Home";
};

export function PlusBadge({ compact, label = "Plus" }: Props) {
  return (
    <View
      className={`rounded-full bg-primary/25 ${compact ? "px-2 py-0.5" : "px-3 py-1"}`}
      accessibilityRole="text"
      accessibilityLabel={`Bookmarked ${label}`}
    >
      <Text
        className={`font-semibold uppercase tracking-wide text-puce-red ${compact ? "text-[10px]" : "text-xs"}`}
      >
        {label}
      </Text>
    </View>
  );
}
