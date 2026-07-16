import { Image, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BRAND_WORDMARK, SERIF_DISPLAY_FONT } from "../constants/theme";
import { NotificationBell } from "./NotificationBell";

type Props = {
  /** Optional content rendered below the wordmark (e.g. feed segmented tabs). */
  children?: React.ReactNode;
};

/**
 * Branded top header (IMG_5360). It is transparent and sits over the screen's
 * `ScreenGradientWash`, so the lavender→peach→tint gradient shows behind the
 * wordmark and (on Feed) the segmented tabs with no divider/border/shadow.
 *
 * The brand lockup renders the transparent ribbon-B mark AS the "B" glyph,
 * immediately followed by "ookmarked" in the same high-contrast serif and the
 * same dusty purple as the logo's B, so it reads as "Bookmarked" like the site.
 */
export function BrandTopHeader({ children }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top + 10 }} className="px-4 pb-3">
      <View className="h-11 flex-row items-center justify-center">
        <View className="flex-row items-center">
          <Image
            source={require("../../assets/brand/logo-mark.png")}
            style={{ width: 30, height: 29, marginRight: -1 }}
            resizeMode="contain"
          />
          <Text
            style={{
              fontFamily: SERIF_DISPLAY_FONT,
              fontSize: 25,
              letterSpacing: 1,
              color: BRAND_WORDMARK,
            }}
          >
            ookmarked
          </Text>
        </View>
        <View className="absolute right-0">
          <NotificationBell />
        </View>
      </View>
      {children}
    </View>
  );
}
