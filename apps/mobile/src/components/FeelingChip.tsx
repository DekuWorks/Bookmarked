import { Text, View } from "react-native";

/** Small colored feeling/emotion chip (feed cards + rating experience). */
const PALETTE = [
  { bg: "bg-rust/15", text: "text-rust" },
  { bg: "bg-royal-orange/20", text: "text-rust" },
  { bg: "bg-primary/20", text: "text-puce-red" },
  { bg: "bg-orange-yellow/25", text: "text-puce-red" },
];

export function FeelingChip({ label, index = 0 }: { label: string; index?: number }) {
  const tone = PALETTE[index % PALETTE.length];
  return (
    <View className={`rounded-full ${tone.bg} px-3 py-1`}>
      <Text className={`text-xs font-medium ${tone.text}`}>{label}</Text>
    </View>
  );
}
