import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookmarkedLogo } from "./BookmarkedLogo";
import { NotificationBell } from "./NotificationBell";

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

  return (
    <View style={{ paddingTop: insets.top + 10 }} className="px-4 pb-3">
      <View className="h-11 flex-row items-center justify-center">
        <BookmarkedLogo size="medium" />
        <View className="absolute right-0">
          <NotificationBell />
        </View>
      </View>
      {children}
    </View>
  );
}
