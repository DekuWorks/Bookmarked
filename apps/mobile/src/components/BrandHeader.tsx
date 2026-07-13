import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BACKGROUND_TINT, SERIF_DISPLAY_FONT } from "../constants/theme";

type Props = {
  title: string;
  subtitle?: string;
};

/**
 * Lavender-to-background gradient header that mirrors the web
 * `feed-header-gradient` / `app-shell-gradient` brand treatment.
 */
export function BrandHeader({ title, subtitle }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={["#E4D8E6", BACKGROUND_TINT]}
      style={{ paddingTop: insets.top + 12 }}
      className="px-5 pb-5"
    >
      <View>
        <Text style={{ fontFamily: SERIF_DISPLAY_FONT }} className="text-3xl text-puce-red">
          {title}
        </Text>
        {subtitle ? <Text className="text-ink-muted mt-1">{subtitle}</Text> : null}
      </View>
    </LinearGradient>
  );
}
