import { useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  enabled: boolean;
  children: ReactNode;
  className?: string;
  label?: string;
};

/** Tap-to-reveal gate for discussion spoilers. */
export function SpoilerReveal({
  enabled,
  children,
  className,
  label = "Contains spoilers — tap to reveal",
}: Props) {
  const [revealed, setRevealed] = useState(false);

  if (!enabled) {
    return <View className={className}>{children}</View>;
  }

  if (revealed) {
    return (
      <View className={className}>
        {children}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hide spoilers"
          onPress={() => setRevealed(false)}
          className="mt-2 min-h-[44px] justify-center self-start"
        >
          <Text className="text-xs font-semibold text-ink-muted">Hide spoilers</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => setRevealed(true)}
      className={`min-h-[44px] justify-center rounded-xl bg-primary/15 px-3 py-3 ${className ?? ""}`}
    >
      <Text className="text-left text-sm font-semibold text-puce-red">{label}</Text>
    </Pressable>
  );
}
