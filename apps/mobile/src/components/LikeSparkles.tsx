import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

type Props = {
  active: boolean;
};

const DRIFTS = [-16, 0, 14, -8, 10];

function Particle({ active, drift, delay }: { active: boolean; drift: number; delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      progress.value = 0;
      return;
    }
    progress.value = 0;
    progress.value = withDelay(delay, withTiming(1, { duration: 650 }));
  }, [active, delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: drift },
      { translateY: -28 * progress.value },
      { scale: 1 - 0.5 * progress.value },
    ],
  }));

  return <Animated.View style={[styles.particle, style]} />;
}

/** Upward-fading sparkles — play only when liking. */
export function LikeSparkles({ active }: Props) {
  if (!active) return null;

  return (
    <View pointerEvents="none" style={styles.wrap}>
      {DRIFTS.map((drift, index) => (
        <Particle key={`${active}-${index}`} active={active} drift={drift} delay={index * 40} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  particle: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#F3904B",
  },
});
