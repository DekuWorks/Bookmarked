import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { HEADER_WASH_HEIGHT_RATIO } from "../constants/theme";
import { useThemeColors } from "../store/themeStore";

type Props = {
  children: ReactNode;
  /** Optional accent from cover color sampling (hex). */
  accentColor?: string | null;
};

export function BookCoverAmbience({ children, accentColor }: Props) {
  const { height } = useWindowDimensions();
  const colors = useThemeColors();
  const washHeight = Math.round(height * 0.32);

  const gradientColors = (
    accentColor
      ? [accentColor + "55", accentColor + "22", colors.background, colors.background]
      : colors.headerWash
  ) as [string, string, ...string[]];

  return (
    <View style={{ marginHorizontal: -16, marginBottom: 8 }}>
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.35, 0.78, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.wash, { minHeight: washHeight }]}
      >
        {accentColor ? (
          <View
            pointerEvents="none"
            style={[styles.glow, { backgroundColor: accentColor }]}
          />
        ) : null}
        <View style={styles.content}>{children}</View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wash: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: 24,
    alignSelf: "center",
    width: 180,
    height: 120,
    borderRadius: 999,
    opacity: 0.2,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
});
