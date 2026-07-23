import { Image, View } from "react-native";

type Props = {
  /** Hide the wordmark, showing only the B mark. */
  compact?: boolean;
  /** Hero-sized lockup for auth screens; default matches in-app headers. */
  size?: "default" | "large";
};

/** Trimmed wordmark aspect ratio (814×181). */
const WORDMARK_ASPECT = 814 / 181;

const SIZES = {
  default: { height: 28 },
  large: { height: 36 },
} as const;

/**
 * Mobile brand lockup: full BOOKMARKED wordmark image, or compact B mark alone.
 */
export function BrandLogo({ compact, size = "default" }: Props) {
  const { height } = SIZES[size];
  const width = Math.round(height * WORDMARK_ASPECT);

  if (compact) {
    return (
      <Image
        source={require("../../assets/brand/logo-mark.png")}
        style={{ width: height, height }}
        resizeMode="contain"
      />
    );
  }

  return (
    <View className="flex-row items-center">
      <Image
        source={require("../../assets/brand/logo.png")}
        style={{ width, height }}
        resizeMode="contain"
      />
    </View>
  );
}
