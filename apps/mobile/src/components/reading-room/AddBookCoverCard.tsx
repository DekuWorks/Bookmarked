import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";
import { CURRENTLY_READING_ADD_COPY } from "../../../../../packages/utils/overviewCopy";
import { useThemeColors } from "../../store/themeStore";

type Props = {
  onPress: () => void;
};

export function AddBookCoverCard({ onPress }: Props) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={CURRENTLY_READING_ADD_COPY.cardLabel}
      className="h-36 w-24 items-center justify-center rounded-xl border border-dashed border-brand-border bg-background active:opacity-70"
    >
      <Ionicons name="add" size={32} color={colors.inkMuted} />
    </Pressable>
  );
}
