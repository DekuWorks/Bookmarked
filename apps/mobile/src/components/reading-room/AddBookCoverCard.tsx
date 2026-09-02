import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";
import { CURRENTLY_READING_ADD_COPY } from "../../../../../packages/utils/overviewCopy";
import {
  CURRENTLY_READING_CARD_SIZE,
  currentlyReadingCardBoxStyle,
} from "../../../../../packages/utils/currentlyReadingCard";
import { useThemeColors } from "../../store/themeStore";

type Props = {
  onPress: () => void;
};

export function AddBookCoverCard({ onPress }: Props) {
  const colors = useThemeColors();
  const size = CURRENTLY_READING_CARD_SIZE.native;
  const box = currentlyReadingCardBoxStyle("native");

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={CURRENTLY_READING_ADD_COPY.cardLabel}
      style={{
        width: box.width,
        minHeight: box.height,
        borderRadius: box.borderRadius,
        alignSelf: "stretch",
      }}
      className="items-center justify-center border border-brand-border bg-primary/10 active:opacity-70"
    >
      <Ionicons name="add" size={size.plusIconPx} color={colors.inkMuted} />
    </Pressable>
  );
}
