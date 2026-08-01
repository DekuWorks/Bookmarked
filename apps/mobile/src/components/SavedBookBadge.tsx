import { Image, Pressable, View } from "react-native";
import {
  BRAND_ASSET_META,
  getSavedBookBadgeDimensions,
  type SavedBookBadgeSize,
} from "../constants/brandAssets";
import { BRAND_ASSETS } from "../constants/brandAssetImages";

/** Flush to cover top-left — no inset so the ribbon reads as hanging off the edge (dp). */
export const SAVED_BOOK_BADGE_INSET = 0;
/** Layer above cover art; below interactive menus. */
export const SAVED_BOOK_BADGE_Z = 20;

type Props = {
  /** When false, badge is hidden. */
  isSaved?: boolean;
  /** Optional toggle — enables 44×44 touch target. */
  onToggle?: () => void;
  size?: SavedBookBadgeSize;
};

/**
 * Saved-book bookmark badge — flush top-left of the cover (positioned by BookCover).
 * Artwork unchanged. Parent must allow overflow so the badge stays fully visible.
 */
export function SavedBookBadge({
  isSaved = true,
  onToggle,
  size = "medium",
}: Props) {
  const { width, height } = getSavedBookBadgeDimensions(size);

  if (!isSaved) return null;

  const label = onToggle
    ? "Remove from saved books"
    : BRAND_ASSET_META.savedBadge.accessibilityLabel;

  const image = (
    <Image
      source={BRAND_ASSETS.savedBadge}
      style={{ width, height }}
      resizeMode="contain"
    />
  );

  if (onToggle) {
    return (
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: isSaved }}
        hitSlop={8}
        style={{
          overflow: "visible",
          minWidth: 44,
          minHeight: 44,
          justifyContent: "flex-start",
          alignItems: "flex-start",
        }}
      >
        {image}
      </Pressable>
    );
  }

  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="image"
      accessible
      style={{ overflow: "visible", width: Math.max(width, 44), height: Math.max(height, 44) }}
    >
      {image}
    </View>
  );
}
