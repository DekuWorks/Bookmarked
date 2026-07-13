import { Image, View } from "react-native";

const RIBBON_ASPECT = 282 / 476; // width / height of the source asset

type Props = {
  /** Ribbon width in px (height derived from the asset aspect ratio). */
  size?: number;
};

/**
 * The official Bookmarked "B" ribbon badge shown on saved book covers,
 * mirroring the web `BookmarkedShelfBadge`. Uses the real brand asset
 * (`assets/brand/bookmark-ribbon.png`, transparent) with a subtle shadow.
 */
export function BookmarkRibbon({ size = 20 }: Props) {
  const height = size / RIBBON_ASPECT;
  return (
    <View
      accessibilityLabel="Saved to Bookmarked"
      style={{
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 3,
      }}
    >
      <Image
        source={require("../../assets/brand/bookmark-ribbon.png")}
        style={{ width: size, height }}
        resizeMode="contain"
      />
    </View>
  );
}
