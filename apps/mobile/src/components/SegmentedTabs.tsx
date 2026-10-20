import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SANS_FONT_BOLD } from "../constants/theme";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { READING_ROOM_MOTION } from "../../../../packages/utils/readingRoomMotion";
import { useThemeColors, useThemeStore } from "../store/themeStore";

type Option<T extends string> = { id: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  /** Stretch each pill to equal width — capsule grid row. */
  equalWidth?: boolean;
  /** Use tighter spacing and smaller labels for dense tab rows. */
  compact?: boolean;
  accessibilityLabel?: string;
  /** Gliding active pill. Reading Room only — other tab bars stay as they are. */
  slidingIndicator?: boolean;
};

/** Pill-style segmented control with theme-aware contrast (light + dark). */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  className,
  equalWidth = false,
  compact = false,
  accessibilityLabel,
  slidingIndicator = false,
}: Props<T>) {
  const colors = useThemeColors();
  const resolved = useThemeStore((state) => state.resolved);
  const reducedMotion = usePrefersReducedMotion();
  const activeTextColor = resolved === "dark" ? colors.background : "#FFFFFF";
  const [trackWidth, setTrackWidth] = useState(0);
  const pad = 4;
  const index = Math.max(0, options.findIndex((option) => option.id === value));
  const segment = options.length > 0 ? Math.max(0, (trackWidth - pad * 2) / options.length) : 0;
  const offset = useSharedValue(0);
  const placed = useRef(false);

  useEffect(() => {
    if (!slidingIndicator) return;
    const next = segment * index;
    if (!placed.current || reducedMotion) {
      offset.value = next;
      if (segment > 0) placed.current = true;
      return;
    }
    offset.value = withTiming(next, {
      duration: READING_ROOM_MOTION.tabIndicatorMs,
      easing: Easing.out(Easing.cubic),
    });
  }, [index, offset, reducedMotion, segment, slidingIndicator]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  if (slidingIndicator) {
    return (
      <View
        className={className}
        accessibilityRole="tablist"
        accessibilityLabel={accessibilityLabel}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 999,
          borderWidth: 1,
          borderColor: "rgba(184, 157, 187, 0.35)",
          backgroundColor: colors.surface,
          padding: pad,
          position: "relative",
        }}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: pad,
              bottom: pad,
              left: pad,
              width: segment,
              borderRadius: 999,
              backgroundColor: colors.puceRed,
            },
            indicatorStyle,
          ]}
        />
        {options.map((option) => {
          const active = value === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="tab"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: active }}
              onPress={() => onChange(option.id)}
              className="min-h-11 min-w-0 flex-1 items-center justify-center rounded-full px-1 py-2"
            >
              <Text
                className={`text-center ${compact ? "text-xs" : "text-sm"}`}
                style={{
                  fontFamily: SANS_FONT_BOLD,
                  color: active ? activeTextColor : colors.puceRed,
                }}
                numberOfLines={1}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View
      className={`flex-row ${compact ? "gap-1" : "gap-2"} ${className ?? ""}`}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const active = value === option.id;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.id)}
            className={`rounded-full py-2 ${compact ? "px-1" : "px-3"} ${
              equalWidth ? "min-w-0 flex-1 items-center" : ""
            }`}
            style={{
              backgroundColor: active ? colors.puceRed : colors.statTile,
              borderWidth: 1,
              borderColor: active ? colors.puceRed : "rgba(184, 157, 187, 0.25)",
            }}
          >
            <Text
              className={`text-center ${compact ? "text-xs" : "text-sm"}`}
              style={{
                fontFamily: SANS_FONT_BOLD,
                color: active ? activeTextColor : colors.puceRed,
              }}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
