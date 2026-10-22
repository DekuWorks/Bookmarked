import { View } from "react-native";

/** Accessible placeholder for a Stats section that is still fetching. */
export function StatsSectionSkeleton({ label }: { label: string }) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
      className="gap-2 py-2"
    >
      <View className="h-3 w-1/3 rounded bg-border" />
      <View className="h-16 rounded-lg bg-border/70" />
      <View className="h-10 rounded-lg bg-border/50" />
    </View>
  );
}
