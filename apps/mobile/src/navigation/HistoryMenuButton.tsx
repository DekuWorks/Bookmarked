import { useEffect, useState } from "react";
import { Modal, Pressable, Text, useWindowDimensions, View } from "react-native";
import type { NavHistoryIcon } from "../../../../packages/utils/navigationHistory";
import { useNavHistory } from "./NavHistoryProvider";

const ICONS: Record<NavHistoryIcon, string> = {
  overview: "⌂",
  library: "▦",
  shelf: "▤",
  book: "▣",
  feed: "☰",
  search: "⌕",
  discover: "✧",
  clubs: "☺",
  challenges: "🏆",
  events: "▦",
  map: "⌖",
  messages: "✉",
  profile: "☺",
  settings: "⚙",
  notes: "✎",
  reviews: "★",
  stats: "▥",
  generic: "›",
};

export function HistoryMenuButton() {
  const { previous, jump } = useNavHistory();
  const [open, setOpen] = useState(false);
  const { width } = useWindowDimensions();
  const menuWidth = Math.min(280, width - 24);

  useEffect(() => {
    if (previous.length === 0) setOpen(false);
  }, [previous.length]);

  if (previous.length === 0) return null;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Show previous screens"
        accessibilityState={{ expanded: open }}
        accessibilityHint="Opens up to three previous screens"
        onPress={() => setOpen(true)}
        className="h-11 w-11 items-center justify-center rounded-full active:bg-primary/10"
      >
        <Text className="text-lg text-puce-red">▾</Text>
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close previous screens"
          className="flex-1"
          onPress={() => setOpen(false)}
        >
          <View
            accessibilityViewIsModal
            className="mt-24 rounded-2xl border border-brand-border bg-surface p-1 shadow-lg"
            style={{ width: menuWidth, marginLeft: 12 }}
          >
            {previous.map((item) => (
              <Pressable
                key={`${item.index}:${item.key}`}
                accessibilityRole="button"
                accessibilityLabel={`Go to ${item.title}`}
                onPress={() => {
                  setOpen(false);
                  jump(item.index);
                }}
                className="min-h-11 flex-row items-center gap-2 rounded-xl px-3 py-2 active:bg-primary/10"
              >
                <Text className="w-5 text-center text-puce-red">{ICONS[item.icon]}</Text>
                <Text className="flex-1 text-base text-ink" numberOfLines={1}>
                  {item.title}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
