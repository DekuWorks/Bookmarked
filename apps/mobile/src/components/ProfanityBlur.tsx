import { useMemo, useState, type ReactNode } from "react";
import { Text, View } from "react-native";
import {
  parseModerationMeta,
  resolveWarnSpans,
  splitTextBySpans,
  type ModerationMeta,
} from "../../../../packages/utils/contentModeration";

type Props = {
  text: string;
  children?: ReactNode;
  className?: string;
  meta?: ModerationMeta | import("../../../../packages/types").ModerationMeta | null;
};

function FlaggedSpan({ word }: { word: string }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <Text>
      {revealed ? (
        <Text
          onPress={() => setRevealed(false)}
          accessibilityRole="button"
          accessibilityLabel="Hide vulgar language"
          accessibilityState={{ expanded: true }}
          className="font-semibold text-puce-red"
        >
          {word}
        </Text>
      ) : (
        <Text
          onPress={() => setRevealed(true)}
          accessibilityRole="button"
          accessibilityLabel="Vulgar Language. Tap to reveal."
          accessibilityState={{ expanded: false }}
          className="font-semibold text-puce-red"
        >
          Vulgar Language – Tap to View.
        </Text>
      )}
    </Text>
  );
}

export function ProfanityBlur({ text, children, className, meta }: Props) {
  const parsed = parseModerationMeta(meta);
  const spans = useMemo(() => resolveWarnSpans(text, parsed), [text, parsed]);

  if (spans.length === 0) {
    return <View className={className}>{children ?? <Text className="text-ink">{text}</Text>}</View>;
  }

  const parts = splitTextBySpans(text, spans);

  return (
    <View className={className}>
      <Text className="text-left leading-6 text-ink">
        {parts.map((part, index) =>
          part.span ? (
            <FlaggedSpan key={`${part.span.start}-${index}`} word={part.text} />
          ) : (
            <Text key={`plain-${index}`}>{part.text}</Text>
          )
        )}
      </Text>
    </View>
  );
}
