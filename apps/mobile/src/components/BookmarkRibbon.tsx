import { Image, View } from "react-native";

const RIBBON_ASPECT = 441 / 547; // width / height of the trimmed source asset

type Props = {
  /** Ribbon width in px (height derived from the asset aspect ratio). */
  size?: number;
};

/**
 * The official Bookmarked "B" ribbon badge shown on saved book covers,
 * mirroring the web `BookmarkedShelfBadge`. Uses the real brand asset
 * (`assets/brand/bookmark-ribbon.png`, transparent).
 */
export function BookmarkRibbon({ size = 20 }: Props) {
  const height = size / RIBBON_ASPECT;
  return (
    <View accessibilityLabel="Saved to Bookmarked" style={{ overflow: "visible" }}>
      <Image
        source={require("../../assets/brand/bookmark-ribbon.png")}
        style={{ width: size, height }}
        resizeMode="contain"
      />
    </View>
  );
}
