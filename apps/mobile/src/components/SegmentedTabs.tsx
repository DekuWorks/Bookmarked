import { Pressable, Text, View } from "react-native";
import { SANS_FONT_BOLD } from "../constants/theme";
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
}: Props<T>) {
  const colors = useThemeColors();
  const resolved = useThemeStore((state) => state.resolved);
  const activeTextColor = resolved === "dark" ? colors.background : "#FFFFFF";

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
