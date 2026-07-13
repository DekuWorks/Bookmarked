import { Text, View } from "react-native";

type Props = {
  label: string;
  count?: number;
};

export function ShelfBadge({ label, count }: Props) {
  return (
    <View className="rounded-full bg-primary/20 border border-primary/40 px-3 py-1 flex-row items-center gap-1">
      <Text className="text-xs font-semibold text-puce-red">{label}</Text>
      {count != null ? (
        <Text className="text-xs font-bold text-puce-red">· {count}</Text>
      ) : null}
    </View>
  );
}
