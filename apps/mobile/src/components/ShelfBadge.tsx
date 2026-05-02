import { Text, View } from "react-native";

/** Placeholder for shelf status chips. */
export function ShelfBadge({ label }: { label: string }) {
  return (
    <View className="rounded-full bg-slate-200 px-3 py-1">
      <Text className="text-xs font-medium text-slate-800">{label}</Text>
    </View>
  );
}
