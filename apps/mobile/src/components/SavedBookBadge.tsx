import { Image, View } from "react-native";
import {
  BRAND_ASSET_META,
  getSavedBookBadgeDimensions,
  type SavedBookBadgeSize,
} from "../constants/brandAssets";
import { BRAND_ASSETS } from "../constants/brandAssetImages";

type Props = {
  size?: SavedBookBadgeSize;
};

/**
 * Saved-book bookmark badge — lavender ribbon with purple B and sparkles.
 * Parent must allow overflow so sparkles render outside cover bounds.
 */
export function SavedBookBadge({ size = "medium" }: Props) {
  const { width, height } = getSavedBookBadgeDimensions(size);

  return (
    <View
      accessibilityLabel={BRAND_ASSET_META.savedBadge.accessibilityLabel}
      accessibilityRole="image"
      style={{ overflow: "visible" }}
    >
      <Image
        source={BRAND_ASSETS.savedBadge}
        style={{ width, height }}
        resizeMode="contain"
      />
    </View>
  );
}
