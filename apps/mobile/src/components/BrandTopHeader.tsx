import { LinearGradient } from "expo-linear-gradient";
import { Image, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  HEADER_GRADIENT,
  HEADER_GRADIENT_EXTRA_HEIGHT,
  HEADER_GRADIENT_LOCATIONS,
  SERIF_DISPLAY_FONT,
} from "../constants/theme";
import { NotificationBell } from "./NotificationBell";

type Props = {
  /** Optional content rendered below the wordmark (e.g. feed segmented tabs). */
  children?: React.ReactNode;
};

/**
 * Branded top header (IMG_5360): a soft lavender→peach gradient that starts
 * edge-to-edge under the status bar and fades seamlessly into the page's
 * lavender tint at the bottom — no divider/border/shadow, so it blends into
 * the page. The brand lockup renders the circular logo mark AS the "B" glyph,
 * immediately followed by "ookmarked" in the same high-contrast serif so it
 * reads as one word / one typeface.
 */
export function BrandTopHeader({ children }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={HEADER_GRADIENT}
      locations={HEADER_GRADIENT_LOCATIONS}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ paddingTop: insets.top + 10, paddingBottom: HEADER_GRADIENT_EXTRA_HEIGHT }}
      className="px-4"
    >
      <View className="h-11 flex-row items-center justify-center">
        <View className="flex-row items-center">
          <Image
            source={require("../../assets/brand/logo-mark.png")}
            style={{ width: 32, height: 32, marginRight: -1 }}
            resizeMode="contain"
          />
          <Text
            style={{ fontFamily: SERIF_DISPLAY_FONT, fontSize: 25, letterSpacing: 1 }}
            className="text-puce-red"
          >
            OOKMARKED
          </Text>
        </View>
        <View className="absolute right-0">
          <NotificationBell />
        </View>
      </View>
      {children}
    </LinearGradient>
  );
}
