import { useState } from "react";
import { Image, Text, View } from "react-native";
import {
  BRAND_ASSET_META,
  getBrandLogoDimensions,
  type BrandLogoSize,
} from "../constants/brandAssets";
import { BRAND_ASSETS } from "../constants/brandAssetImages";

type Props = {
  /** Hide the wordmark, showing only the B mark. */
  compact?: boolean;
  size?: BrandLogoSize;
};

/**
 * Official Bookmarked wordmark or compact B mark.
 * Falls back to plain text "Bookmarked" if the image fails to load.
 */
export function BookmarkedLogo({ compact = false, size = "medium" }: Props) {
  const [imageError, setImageError] = useState(false);
  const { height, width } = getBrandLogoDimensions(size);

  if (compact) {
    if (imageError) {
      return (
        <Text className="text-sm font-bold text-puce-red" accessibilityElementsHidden>
          B
        </Text>
      );
    }

    return (
      <Image
        source={BRAND_ASSETS.logoMark}
        style={{ width: height, height }}
        resizeMode="contain"
        onError={() => setImageError(true)}
        accessibilityElementsHidden
      />
    );
  }

  if (imageError) {
    return (
      <Text className="text-lg font-bold text-puce-red" accessibilityRole="header">
        Bookmarked
      </Text>
    );
  }

  return (
    <View className="flex-row items-center">
      <Image
        source={BRAND_ASSETS.logoHorizontal}
        style={{ width, height }}
        resizeMode="contain"
        onError={() => setImageError(true)}
        accessibilityLabel={BRAND_ASSET_META.logoHorizontal.alt}
      />
    </View>
  );
}
