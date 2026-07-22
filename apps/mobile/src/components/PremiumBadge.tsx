import { Text, View } from "react-native";

type Props = {
  compact?: boolean;
};

export function PremiumBadge({ compact }: Props) {
  return (
    <View className="rounded-full bg-primary/25 px-3 py-1">
      <Text
        className={`font-semibold uppercase tracking-wide text-puce-red ${compact ? "text-[10px]" : "text-xs"}`}
      >
        Premium
      </Text>
    </View>
  );
}
