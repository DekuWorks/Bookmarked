import { useEffect } from "react";
import { AccessibilityInfo, Image, StyleSheet, useColorScheme, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { BRAND_ASSETS } from "../constants/brandAssetImages";

/** Process-only flag so resume / later screens never replay this intro. */
let launchIntroPlayedThisProcess = false;

export function hasPlayedLaunchIntro(): boolean {
  return launchIntroPlayedThisProcess;
}

export function markLaunchIntroPlayed(): void {
  launchIntroPlayedThisProcess = true;
}

type Props = {
  onFinished: () => void;
};

/**
 * Brief cinematic intro on a fresh process launch only.
 * waiting-on-assets: Marcus/Leighton final motion + sparkle stills.
 * Falls back to the existing logo-mark until those land.
 */
export function LaunchIntro({ onFinished }: Props) {
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.88);

  useEffect(() => {
    if (hasPlayedLaunchIntro()) {
      onFinished();
      return;
    }

    let cancelled = false;

    function finish(): void {
      if (cancelled) return;
      markLaunchIntroPlayed();
      onFinished();
    }

    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) return;
      if (reduceMotion) {
        finish();
        return;
      }
      opacity.value = withSequence(
        withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 620 }),
        withTiming(0, { duration: 260, easing: Easing.in(Easing.cubic) }, (finished) => {
          if (finished) runOnJS(finish)();
        })
      );
      scale.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    });

    return () => {
      cancelled = true;
    };
  }, [onFinished, opacity, scale]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, { backgroundColor: dark ? "#1A1326" : "#F4EEFA" }]}
    >
      <Animated.View style={logoStyle}>
        <Image
          source={BRAND_ASSETS.logoMark}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Bookmarked"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
  logo: {
    width: 128,
    height: 128,
  },
});
