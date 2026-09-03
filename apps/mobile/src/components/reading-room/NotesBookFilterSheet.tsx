import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookCover } from "../BookCover";
import { Input } from "../Input";
import {
  NOTES_BOOK_FILTER_COPY,
  NOTES_BOOK_SEARCH_THRESHOLD,
  filterNotesBookOptionsByQuery,
  formatNotesBookCount,
  notesBookFilterLabel,
  type NotesBookFilterOption,
} from "../../../../../packages/utils/notesBookFilter";

type Props = {
  visible: boolean;
  options: NotesBookFilterOption[];
  selectedUserBookId: string | null;
  onClose: () => void;
  onSelect: (userBookId: string | null) => void;
};

export function NotesBookFilterSheet({
  visible,
  options,
  selectedUserBookId,
  onClose,
  onSelect,
}: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => filterNotesBookOptionsByQuery(options, query),
    [options, query]
  );
  const showSearch = options.length >= NOTES_BOOK_SEARCH_THRESHOLD;

  function choose(userBookId: string | null) {
    onSelect(userBookId);
    setQuery("");
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
          <Text
            className="text-xl font-bold text-ink"
            accessibilityRole="header"
          >
            {NOTES_BOOK_FILTER_COPY.label}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={() => {
              setQuery("");
              onClose();
            }}
            className="min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-primary/15 active:opacity-80"
          >
            <Text className="text-sm font-semibold text-puce-red">Close</Text>
          </Pressable>
        </View>

        {showSearch ? (
          <View className="px-5">
            <Input
              accessibilityLabel={NOTES_BOOK_FILTER_COPY.searchLabel}
              placeholder={NOTES_BOOK_FILTER_COPY.searchPlaceholder}
              autoCapitalize="none"
              autoCorrect={false}
              value={query}
              onChangeText={setQuery}
            />
          </View>
        ) : null}

        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24, gap: 8 }}
        >
          <Pressable
            onPress={() => choose(null)}
            accessibilityRole="button"
            accessibilityLabel={NOTES_BOOK_FILTER_COPY.allBooks}
            accessibilityState={{ selected: selectedUserBookId == null }}
            className={`min-h-[44px] justify-center rounded-xl border px-3 py-3 ${
              selectedUserBookId == null
                ? "border-puce-red bg-primary/15"
                : "border-brand-border bg-surface"
            }`}
          >
            <Text className="text-sm font-semibold text-ink">
              {NOTES_BOOK_FILTER_COPY.allBooks}
            </Text>
          </Pressable>

          {filtered.map((option) => {
            const selected = option.userBookId === selectedUserBookId;
            return (
              <Pressable
                key={option.userBookId}
                onPress={() => choose(option.userBookId)}
                accessibilityRole="button"
                accessibilityLabel={`${option.title}${option.author ? ` by ${option.author}` : ""}, ${formatNotesBookCount(option.noteCount)}`}
                accessibilityState={{ selected }}
                className={`min-h-[44px] flex-row items-center gap-3 rounded-xl border p-2 ${
                  selected ? "border-puce-red bg-primary/15" : "border-brand-border bg-surface"
                }`}
              >
                <BookCover
                  url={option.coverUrl}
                  title={option.title}
                  sizeClassName="w-10 h-14"
                  saved
                />
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-semibold text-ink" numberOfLines={2}>
                    {option.title}
                  </Text>
                  {option.author ? (
                    <Text className="mt-0.5 text-xs text-ink-muted" numberOfLines={1}>
                      {option.author}
                    </Text>
                  ) : null}
                  <Text className="mt-0.5 text-xs text-ink-muted">
                    {formatNotesBookCount(option.noteCount)}
                  </Text>
                </View>
              </Pressable>
            );
          })}

          {filtered.length === 0 ? (
            <Text className="py-6 text-sm text-ink-muted">No books match that search.</Text>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

export function NotesBookFilterButton({
  options,
  selectedUserBookId,
  onPress,
}: {
  options: NotesBookFilterOption[];
  selectedUserBookId: string | null;
  onPress: () => void;
}) {
  const label = notesBookFilterLabel(selectedUserBookId, options);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${NOTES_BOOK_FILTER_COPY.label}: ${label}`}
      className="min-h-[44px] flex-row items-center justify-between rounded-xl border border-brand-border bg-surface px-3 py-2.5 active:opacity-80"
    >
      <View className="min-w-0 flex-1">
        <Text className="text-xs font-medium text-ink-muted">
          {NOTES_BOOK_FILTER_COPY.label}
        </Text>
        <Text className="mt-0.5 text-sm font-semibold text-ink" numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text className="text-ink-muted" accessibilityElementsHidden>
        ▾
      </Text>
    </Pressable>
  );
}
