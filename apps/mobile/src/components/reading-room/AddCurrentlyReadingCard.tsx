import { Pressable, Text } from "react-native";
import { CURRENTLY_READING_ADD_COPY } from "../../../../../packages/utils/overviewCopy";

type Props = {
  onPress: () => void;
};

export function AddCurrentlyReadingCard({ onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={CURRENTLY_READING_ADD_COPY.cardLabel}
      onPress={onPress}
      className="min-h-[220px] items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/50 bg-primary/10 px-6 active:opacity-80"
    >
      <Text className="text-5xl text-primary">+</Text>
      <Text className="text-center text-sm font-semibold text-puce-red">
        {CURRENTLY_READING_ADD_COPY.cardLabel}
      </Text>
    </Pressable>
  );
}
