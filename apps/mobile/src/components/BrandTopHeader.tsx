import { Image, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NotificationBell } from "./NotificationBell";

/** Trimmed wordmark aspect ratio (814×181). */
const WORDMARK_ASPECT = 814 / 181;
const WORDMARK_HEIGHT = 30;

type Props = {
  /** Optional content rendered below the wordmark (e.g. feed segmented tabs). */
  children?: React.ReactNode;
};

/**
 * Branded top header. Transparent over the screen's `ScreenGradientWash` so the
 * lavender→peach→tint gradient shows behind the wordmark and segmented tabs.
 */
export function BrandTopHeader({ children }: Props) {
  const insets = useSafeAreaInsets();
  const width = Math.round(WORDMARK_HEIGHT * WORDMARK_ASPECT);

  return (
    <View style={{ paddingTop: insets.top + 10 }} className="px-4 pb-3">
      <View className="h-11 flex-row items-center justify-center">
        <Image
          source={require("../../assets/brand/logo.png")}
          style={{ width, height: WORDMARK_HEIGHT }}
          resizeMode="contain"
        />
        <View className="absolute right-0">
          <NotificationBell />
        </View>
      </View>
      {children}
    </View>
  );
}
