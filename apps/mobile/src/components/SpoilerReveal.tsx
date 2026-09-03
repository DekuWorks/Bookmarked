import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useSpoilerReveal } from "../hooks/useSpoilerReveal";
import { SPOILER_WARNING_COPY } from "../../../../packages/utils";

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
  label = SPOILER_WARNING_COPY.hidden,
}: Props) {
  const spoiler = useSpoilerReveal();

  if (!enabled) {
    return <View className={className}>{children}</View>;
  }

  if (spoiler.revealed) {
    return (
      <View className={className}>
        {children}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={SPOILER_WARNING_COPY.hide}
          onPress={spoiler.toggle}
          className="mt-2 min-h-[44px] justify-center self-start"
        >
          <Text className="text-xs font-semibold text-ink-muted">{SPOILER_WARNING_COPY.hide}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={spoiler.toggle}
      className={`min-h-[44px] justify-center rounded-xl bg-primary/15 px-3 py-3 ${className ?? ""}`}
    >
      <Text className="text-left text-sm font-semibold text-puce-red">{label}</Text>
    </Pressable>
  );
}
