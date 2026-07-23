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
 *
 * ## Bookmark overlay replacement (pending design approval)
 * When the larger-sparkles bookmark overlay asset is approved, replace:
 * - `apps/mobile/assets/brand/bookmark-ribbon.png`
 * - Web counterpart: `apps/web/public/images/bookmark-ribbon.png`
 * No component API changes are required.
 */
export function BookmarkRibbon({ size = 20 }: Props) {
  const height = size / RIBBON_ASPECT;
  return (
    <View accessibilityLabel="Saved to Bookmarked">
      <Image
        source={require("../../assets/brand/bookmark-ribbon.png")}
        style={{ width: size, height }}
        resizeMode="contain"
      />
    </View>
  );
}
