import { useEffect, useState } from "react";
import { AccessibilityInfo, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

type Props = {
  /** True only while playing the unliked → liked burst. */
  active: boolean;
};

const BRAND_LILAC = "#B89DBB";
const BRAND_LAVENDER = "#C9B4CC";
const BRAND_DEEP = "#9A7BA0";
const BRAND_SOFT = "#D4C0D7";

const PARTICLES = [
  { drift: -20, delay: 0, duration: 900, size: 9, color: BRAND_LILAC },
  { drift: -6, delay: 50, duration: 1050, size: 11, color: BRAND_LAVENDER },
  { drift: 14, delay: 90, duration: 950, size: 8, color: BRAND_DEEP },
  { drift: -12, delay: 140, duration: 1100, size: 10, color: BRAND_SOFT },
  { drift: 8, delay: 180, duration: 1000, size: 12, color: BRAND_LILAC },
  { drift: 22, delay: 220, duration: 1150, size: 8, color: BRAND_DEEP },
  { drift: -4, delay: 260, duration: 850, size: 9, color: BRAND_LAVENDER },
  { drift: 10, delay: 300, duration: 1200, size: 10, color: BRAND_LILAC },
] as const;

/** 4-point brand sparkle via crossed pills (no SVG dependency). */
function SparkleGlyph({ size, color }: { size: number; color: string }) {
  const arm = Math.max(2, Math.round(size * 0.32));
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          position: "absolute",
          width: arm,
          height: size,
          borderRadius: arm,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size,
          height: arm,
          borderRadius: arm,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

function Particle({
  active,
  drift,
  delay,
  duration,
  size,
  color,
}: {
  active: boolean;
  drift: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      progress.value = 0;
      return;
    }
    progress.value = 0;
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) })
    );
  }, [active, delay, duration, progress]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    const scale = p < 0.35 ? 0.8 + (p / 0.35) * 0.48 : 1.28 - ((p - 0.35) / 0.65) * 0.23;
    return {
      opacity: 0.95 * (1 - p),
      transform: [{ translateX: drift * p }, { translateY: -40 * p }, { scale }],
    };
  });

  return (
    <Animated.View style={[styles.particle, style]}>
      <SparkleGlyph size={size} color={color} />
    </Animated.View>
  );
}

/**
 * Brand sparkles near the Like control.
 * Pass `active` only on unliked → liked (never on unlike).
 */
export function BookmarkedLikeSparkles({ active }: Props) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReducedMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (enabled) => {
      setReducedMotion(enabled);
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  if (!active) return null;

  if (reducedMotion) {
    return (
      <View pointerEvents="none" style={styles.wrap} accessibilityElementsHidden>
        <SparkleGlyph size={10} color={BRAND_LILAC} />
      </View>
    );
  }

  return (
    <View pointerEvents="none" style={styles.wrap} accessibilityElementsHidden>
      {PARTICLES.map((particle, index) => (
        <Particle
          key={`${active}-${index}`}
          active={active}
          drift={particle.drift}
          delay={particle.delay}
          duration={particle.duration}
          size={particle.size}
          color={particle.color}
        />
      ))}
    </View>
  );
}

/** @deprecated Use BookmarkedLikeSparkles */
export const LikeSparkles = BookmarkedLikeSparkles;

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  particle: {
    position: "absolute",
  },
});
