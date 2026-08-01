import { Text, View } from "react-native";
import { resolveNoteTagTone } from "../../../../packages/utils/noteTag";
import { SANS_FONT_MEDIUM } from "../constants/theme";

type Props = {
  label: string;
  color?: string | null;
  category?: string | null;
  isCustom?: boolean;
  emoji?: string | null;
};

/**
 * Unified note tag pill for builtin, custom, mood, vibe, emotion, imported, and legacy tags.
 * Color priority: stored custom → category default → Bookmarked purple.
 * Respects Dynamic Type via default Text scaling.
 */
export function NoteTag({ label, color, category, isCustom, emoji }: Props) {
  const tone = resolveNoteTagTone({ label, color, category, isCustom });

  return (
    <View
      style={{
        backgroundColor: tone.background,
        borderColor: tone.border,
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        maxWidth: "100%",
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
      }}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      {emoji ? <Text>{emoji}</Text> : null}
      <Text
        style={{ fontFamily: SANS_FONT_MEDIUM, color: tone.text, fontSize: 12 }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}
