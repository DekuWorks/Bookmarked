import { Image, Text, View } from "react-native";
import { BRAND_WORDMARK, SERIF_DISPLAY_FONT } from "../constants/theme";

type Props = {
  /** Hide the wordmark, showing only the B mark. */
  compact?: boolean;
  /** Hero-sized lockup for auth screens; default matches in-app headers. */
  size?: "default" | "large";
};

const SIZES = {
  default: { markW: 28, markH: 27, fontSize: 22, letterSpacing: 0.5 },
  large: { markW: 36, markH: 35, fontSize: 30, letterSpacing: 0.75 },
} as const;

/**
 * Mobile brand lockup: transparent ribbon-B mark as the letter "B", then
 * "ookmarked" in the matching dusty purple (same pattern as BrandTopHeader /
 * web BrandLogo).
 */
export function BrandLogo({ compact, size = "default" }: Props) {
  const s = SIZES[size];

  return (
    <View className="flex-row items-center">
      <Image
        source={require("../../assets/brand/logo-mark.png")}
        style={{ width: s.markW, height: s.markH, marginRight: -1 }}
        resizeMode="contain"
      />
      {compact ? null : (
        <Text
          style={{
            fontFamily: SERIF_DISPLAY_FONT,
            fontSize: s.fontSize,
            letterSpacing: s.letterSpacing,
            color: BRAND_WORDMARK,
          }}
        >
          ookmarked
        </Text>
      )}
    </View>
  );
}
