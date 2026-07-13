import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

/**
 * Shared scroll state that drives the Instagram-style floating tab bar.
 *
 * `floating` is a 0→1 progress value (0 = docked to the bottom edge, 1 =
 * detached floating pill). Every tab screen attaches `onScroll` to its
 * Animated scroll view so scrolling down floats the bar and scrolling up /
 * reaching the top re-docks it. A single shared value keeps all tab screens
 * in sync.
 */

type TabBarScrollValue = {
  floating: SharedValue<number>;
  onScroll: ReturnType<typeof useAnimatedScrollHandler>;
};

const TabBarScrollContext = createContext<TabBarScrollValue | null>(null);

export function TabBarScrollProvider({ children }: { children: ReactNode }) {
  const floating = useSharedValue(0);
  const lastY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      const dy = y - lastY.value;

      if (y <= 6) {
        floating.value = withTiming(0, { duration: 180 });
      } else if (dy > 3) {
        floating.value = withTiming(1, { duration: 180 });
      } else if (dy < -3) {
        floating.value = withTiming(0, { duration: 180 });
      }

      lastY.value = y;
    },
  });

  const value = useMemo(() => ({ floating, onScroll }), [floating, onScroll]);

  return <TabBarScrollContext.Provider value={value}>{children}</TabBarScrollContext.Provider>;
}

export function useTabBarScroll(): TabBarScrollValue {
  const ctx = useContext(TabBarScrollContext);
  if (!ctx) {
    throw new Error("useTabBarScroll must be used within a TabBarScrollProvider");
  }
  return ctx;
}

/** Bottom padding tab screens should reserve so content clears the floating bar. */
export const TAB_BAR_SPACE = 96;
