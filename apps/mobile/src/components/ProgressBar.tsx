import { useEffect, useRef } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { goalBarFillPercent, READING_ROOM_MOTION } from "../../../../packages/utils/readingRoomMotion";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { useThemeStore } from "../store/themeStore";

type Props = {
  percent: number;
  /** Animate only when the caller wants a change, and only after the first value. */
  animate?: boolean;
};

/** Lavender/puce progress track mirroring the web reading-progress bars. */
export function ProgressBar({ percent, animate = false }: Props) {
  const reducedMotion = usePrefersReducedMotion();
  const resolved = useThemeStore((state) => state.resolved);
  const target = goalBarFillPercent(percent) / 100;
  const scale = useSharedValue(target);
  const last = useRef(target);
  const fill = resolved === "dark" ? "#FFB07A" : "#F3904B";

  useEffect(() => {
    if (last.current === target) return;
    last.current = target;
    if (!animate || reducedMotion) {
      scale.value = target;
      return;
    }
    scale.value = withTiming(target, {
      duration: READING_ROOM_MOTION.progressMs,
      easing: Easing.out(Easing.cubic),
    });
  }, [animate, reducedMotion, scale, target]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ scaleX: Math.max(0, scale.value) }],
  }));

  return (
    <View className="h-2 w-full overflow-hidden rounded-full bg-primary/20">
      <Animated.View
        style={[
          {
            height: 8,
            width: "100%",
            borderRadius: 999,
            backgroundColor: fill,
            transformOrigin: "left center",
          },
          animated,
        ]}
      />
    </View>
  );
}
