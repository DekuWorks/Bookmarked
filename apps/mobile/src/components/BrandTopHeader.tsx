import { LinearGradient } from "expo-linear-gradient";
import { Image, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NotificationBell } from "./NotificationBell";

type Props = {
  /** Optional content rendered below the wordmark (e.g. feed segmented tabs). */
  children?: React.ReactNode;
};

/**
 * Branded top header from the mockups: centered "BOOKMARKED" wordmark with
 * sparkle accents over a soft lavender→peach gradient, with the notification
 * bell pinned to the right.
 */
export function BrandTopHeader({ children }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={["#D9C9EC", "#F1D3CB", "#FAE3D6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ paddingTop: insets.top + 8 }}
      className="px-4 pb-3"
    >
      <View className="h-11 flex-row items-center justify-center">
        <View className="flex-row items-center">
          <Image
            source={require("../../assets/brand/logo-mark.png")}
            style={{ width: 30, height: 30 }}
            resizeMode="contain"
            className="mr-2 rounded-full"
          />
          <Text className="text-sm text-primary-dark">✦ </Text>
          <Text className="text-xl font-black tracking-[2px] text-puce-red">BOOKMARKED</Text>
          <Text className="text-sm text-primary-dark"> ✦</Text>
        </View>
        <View className="absolute right-0">
          <NotificationBell />
        </View>
      </View>
      {children}
    </LinearGradient>
  );
}
