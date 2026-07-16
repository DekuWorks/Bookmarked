import { useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { containsProfanity } from "../utils/profanity";

type Props = {
  /** Raw text used for detection (not necessarily what is rendered). */
  text: string;
  children: ReactNode;
  className?: string;
};

/**
 * Frosted overlay when `text` contains curated profanity.
 * Tap to reveal; optional re-hide. Spoiler gate stays separate.
 */
export function ProfanityBlur({ text, children, className }: Props) {
  const flagged = containsProfanity(text);
  const [revealed, setRevealed] = useState(false);

  if (!flagged) {
    return <View className={className}>{children}</View>;
  }

  const hidden = !revealed;

  return (
    <View className={className}>
      <View className="relative">
        <View
          pointerEvents={hidden ? "none" : "auto"}
          style={hidden ? { opacity: 0.2 } : undefined}
          accessibilityElementsHidden={hidden}
          importantForAccessibility={hidden ? "no-hide-descendants" : "auto"}
        >
          {children}
        </View>

        {hidden ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Show content that may contain strong language"
            accessibilityState={{ expanded: false }}
            onPress={() => setRevealed(true)}
            className="absolute inset-0 items-center justify-center rounded-xl bg-surface/85 px-3 active:opacity-90"
          >
            <View className="rounded-full border border-brand-border bg-primary/15 px-4 py-2">
              <Text className="text-xs font-semibold text-puce-red">Show content</Text>
            </View>
          </Pressable>
        ) : null}
      </View>

      {!hidden ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hide content with strong language"
          accessibilityState={{ expanded: true }}
          onPress={() => setRevealed(false)}
          className="mt-1.5 self-start active:opacity-70"
        >
          <Text className="text-xs font-medium text-ink-muted">Hide content</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
