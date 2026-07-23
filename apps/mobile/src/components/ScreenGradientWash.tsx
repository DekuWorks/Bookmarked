import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, useWindowDimensions } from "react-native";
import { HEADER_WASH_HEIGHT_RATIO } from "../constants/theme";
import { useThemeColors } from "../store/themeStore";

type Props = {
  /** Explicit wash height in px — use to clip the wash to a measured header. */
  height?: number;
  /** Fraction of screen height when `height` is not set (default 0.25). */
  heightRatio?: number;
};

/**
 * Top-of-screen lavender→peach→tint background wash. Absolutely positioned so
 * it sits BEHIND the screen's top content (header + first items) and resolves
 * seamlessly into the page tint roughly a quarter of the way down the screen.
 *
 * Render this as the FIRST child of a screen's root View (whose background is
 * the page tint). Header/content rendered after it draws on top.
 */
export function ScreenGradientWash({
  height: heightProp,
  heightRatio = HEADER_WASH_HEIGHT_RATIO,
}: Props = {}) {
  const { height: windowHeight } = useWindowDimensions();
  const colors = useThemeColors();
  const washHeight =
    heightProp != null ? Math.round(heightProp) : Math.round(windowHeight * heightRatio);

  return (
    <LinearGradient
      pointerEvents="none"
      colors={[...colors.headerWash]}
      locations={[0, 0.35, 0.85, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.wash, { height: washHeight }]}
    />
  );
}

const styles = StyleSheet.create({
  wash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
});
