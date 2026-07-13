import { Text, View } from "react-native";

const RIBBON_COLOR = "#5B3B8C"; // deep purple, matches the mockup ribbon

type Props = {
  /** Overall ribbon width in px. */
  size?: number;
};

/**
 * The Bookmarked "B" ribbon/bookmark badge shown on saved book covers
 * (IMG_5362): a deep-purple bookmark with a white "B" and a pointed tail.
 */
export function BookmarkRibbon({ size = 20 }: Props) {
  const point = size / 2;
  return (
    <View className="items-center" accessibilityLabel="Saved to Bookmarked">
      <View
        style={{
          width: size,
          paddingVertical: 2,
          backgroundColor: RIBBON_COLOR,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
        }}
      >
        <Text
          style={{ fontSize: size * 0.62, lineHeight: size * 0.78 }}
          className="text-center font-black text-white"
        >
          B
        </Text>
      </View>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: point,
          borderRightWidth: point,
          borderTopWidth: point * 0.8,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: RIBBON_COLOR,
        }}
      />
    </View>
  );
}
