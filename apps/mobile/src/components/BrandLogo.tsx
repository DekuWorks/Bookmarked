import { Image, Text, View } from "react-native";
import { BRAND_WORDMARK, SERIF_DISPLAY_FONT } from "../constants/theme";

type Props = {
  /** Hide the wordmark, showing only the B mark. */
  compact?: boolean;
};

/**
 * Mobile brand lockup: transparent ribbon-B mark as the letter "B", then
 * "ookmarked" in the matching dusty purple (same pattern as BrandTopHeader /
 * web BrandLogo).
 */
export function BrandLogo({ compact }: Props) {
  return (
    <View className="flex-row items-center">
      <Image
        source={require("../../assets/brand/logo-mark.png")}
        style={{ width: 28, height: 27 }}
        resizeMode="contain"
      />
      {compact ? null : (
        <Text
          style={{
            fontFamily: SERIF_DISPLAY_FONT,
            fontSize: 22,
            letterSpacing: 0.5,
            color: BRAND_WORDMARK,
            marginLeft: -1,
          }}
        >
          ookmarked
        </Text>
      )}
    </View>
  );
}
