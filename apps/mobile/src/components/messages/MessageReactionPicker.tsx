import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  customEmojiFromQuery,
  filterEmojiCategories,
  isValidReactionEmoji,
  normalizeReactionEmoji,
} from "../../utils/emoji";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
};

export function MessageReactionPicker({ visible, onClose, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const customEmoji = useMemo(() => customEmojiFromQuery(query), [query]);
  const categories = useMemo(() => filterEmojiCategories(query), [query]);
  const hasResults = categories.some((category) => category.emojis.length > 0);

  function handleSelect(emoji: string) {
    if (!isValidReactionEmoji(emoji)) return;
    onSelect(normalizeReactionEmoji(emoji));
    setQuery("");
    onClose();
  }

  function handleClose() {
    setQuery("");
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <Pressable className="flex-1 justify-end bg-black/40" onPress={handleClose}>
        <Pressable
          className="max-h-[70%] rounded-t-2xl bg-surface"
          style={{ paddingBottom: insets.bottom + 8 }}
          onPress={(event) => event.stopPropagation()}
        >
          <View className="border-b border-brand-border px-4 py-3">
            <Text className="text-center text-sm font-semibold text-puce-red">
              Choose a reaction
            </Text>
          </View>

          <View className="border-b border-brand-border p-3">
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search or paste emoji…"
              placeholderTextColor="#A99DAE"
              autoFocus
              className="rounded-xl border border-brand-border bg-background px-3 py-2 text-sm text-ink"
            />
          </View>

          <ScrollView className="max-h-80 p-3" keyboardShouldPersistTaps="handled">
            {customEmoji ? (
              <Pressable
                onPress={() => handleSelect(customEmoji)}
                className="mb-3 flex-row items-center gap-2 rounded-xl border border-brand-border bg-background px-3 py-2 active:opacity-80"
              >
                <Text className="text-xl">{customEmoji}</Text>
                <Text className="text-sm text-ink-muted">Use custom emoji</Text>
              </Pressable>
            ) : null}

            {hasResults ? (
              <View className="gap-4">
                {categories.map((category) => (
                  <View key={category.label}>
                    <Text className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                      {category.label}
                    </Text>
                    <View className="flex-row flex-wrap">
                      {category.emojis.map((option) => (
                        <Pressable
                          key={`${category.label}-${option.emoji}`}
                          onPress={() => handleSelect(option.emoji)}
                          className="h-10 w-10 items-center justify-center rounded-lg active:bg-background"
                        >
                          <Text className="text-xl">{option.emoji}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="px-1 py-6 text-center text-xs text-ink-muted">
                {query.trim()
                  ? "No matches. Paste an emoji above to use it."
                  : "Search for an emoji or paste your own."}
              </Text>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
