import { Text, View } from "react-native";

/** Small puce-red pill badge, mirroring the web unread badges. */
export function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View className="ml-1.5 h-4 min-w-[16px] items-center justify-center rounded-full bg-puce-red px-1">
      <Text className="text-[10px] font-bold text-white">{count > 9 ? "9+" : count}</Text>
    </View>
  );
}
