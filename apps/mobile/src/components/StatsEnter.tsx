import { useEffect, type ReactNode } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { statsCardMotion } from "../../../../packages/utils/readingRoomMotion";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

/** Fade and shift a Stats card in. Reduced motion shows it immediately. */
export function StatsEnter({ index = 0, children }: { index?: number; children: ReactNode }) {
  const reducedMotion = usePrefersReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const shift = useSharedValue(reducedMotion ? 0 : statsCardMotion(false).shiftPx);

  useEffect(() => {
    const motion = statsCardMotion(reducedMotion);
    if (motion.durationMs === 0) {
      opacity.value = 1;
      shift.value = 0;
      return;
    }
    const timing = { duration: motion.durationMs, easing: Easing.out(Easing.cubic) };
    opacity.value = withDelay(motion.delayMs(index), withTiming(1, timing));
    shift.value = withDelay(motion.delayMs(index), withTiming(0, timing));
  }, [index, opacity, reducedMotion, shift]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: shift.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}
