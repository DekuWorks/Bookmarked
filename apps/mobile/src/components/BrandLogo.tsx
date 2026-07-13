import { Text, View } from "react-native";

type Props = {
  /** Hide the wordmark, showing only the circular "B" badge. */
  compact?: boolean;
};

/**
 * Mobile brand mark mirroring the web `BrandLogo` (logo-circle + "Bookmarked").
 * Uses a lavender circular "B" badge to match the Bookmarked "B" motif without
 * bundling a raster asset.
 */
export function BrandLogo({ compact }: Props) {
  return (
    <View className="flex-row items-center gap-2">
      <View className="h-7 w-7 items-center justify-center rounded-full bg-primary">
        <Text className="text-sm font-black text-white">B</Text>
      </View>
      {compact ? null : (
        <Text className="text-xl font-bold tracking-tight text-puce-red">Bookmarked</Text>
      )}
    </View>
  );
}
