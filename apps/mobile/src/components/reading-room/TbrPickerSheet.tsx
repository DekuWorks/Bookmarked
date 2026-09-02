import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookCover } from "../BookCover";
import { Button } from "../Button";
import { Input } from "../Input";
import { ShelfBadge } from "../ShelfBadge";
import { getUserLibraryBooks, type LibraryBookRow } from "../../services/library";
import {
  TBR_PICKER_SEARCH_THRESHOLD,
  filterTbrBooksByQuery,
  selectWantToReadBooks,
} from "../../../../../packages/utils/currentlyReadingAdd";
import { CURRENTLY_READING_ADD_COPY } from "../../../../../packages/utils/overviewCopy";

type Props = {
  visible: boolean;
  userId: string;
  movingId: string | null;
  onClose: () => void;
  onSelect: (row: LibraryBookRow) => void;
  onSearchForABook: () => void;
};

export function TbrPickerSheet({
  visible,
  userId,
  movingId,
  onClose,
  onSelect,
  onSearchForABook,
}: Props) {
  const insets = useSafeAreaInsets();
  const [books, setBooks] = useState<LibraryBookRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [reloadId, setReloadId] = useState(0);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    void getUserLibraryBooks(userId)
      .then((rows) => {
        if (cancelled) return;
        setBooks(selectWantToReadBooks(rows));
        setError(null);
        setQuery("");
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Could not load your TBR.");
      });

    return () => {
      cancelled = true;
    };
  }, [visible, userId, reloadId]);

  const filtered = useMemo(
    () => (books ? filterTbrBooksByQuery(books, query) : []),
    [books, query]
  );
  const showSearch = (books?.length ?? 0) >= TBR_PICKER_SEARCH_THRESHOLD;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
          <Text className="text-xl font-bold text-ink">{CURRENTLY_READING_ADD_COPY.chooseFromTbr}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            className="min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-primary/15 active:opacity-80"
          >
            <Text className="text-sm font-semibold text-puce-red">Close</Text>
          </Pressable>
        </View>

        {showSearch ? (
          <View className="px-5">
            <Input
              placeholder="Filter by title or author"
              autoCapitalize="none"
              autoCorrect={false}
              value={query}
              onChangeText={setQuery}
            />
          </View>
        ) : null}

        {books === null && !error ? (
          <View className="items-center py-10" accessibilityLabel="Loading TBR">
            <ActivityIndicator size="large" color="#642F37" />
          </View>
        ) : null}

        {error ? (
          <View className="items-center gap-3 px-5 py-8">
            <Text className="text-center text-sm text-rust">{error}</Text>
            <Button
              title="Retry"
              variant="ghost"
              onPress={() => {
                setError(null);
                setBooks(null);
                setReloadId((id) => id + 1);
              }}
            />
          </View>
        ) : null}

        {books && books.length === 0 && !error ? (
          <View className="items-center gap-4 px-5 py-10">
            <Text className="text-center text-sm text-ink-muted">
              {CURRENTLY_READING_ADD_COPY.tbrEmpty}
            </Text>
            <Button
              title={CURRENTLY_READING_ADD_COPY.searchForABook}
              onPress={onSearchForABook}
            />
          </View>
        ) : null}

        {books && books.length > 0 ? (
          <ScrollView
            className="flex-1 px-5"
            contentContainerStyle={{ paddingBottom: insets.bottom + 24, gap: 8 }}
          >
            {filtered.length === 0 ? (
              <Text className="py-6 text-sm text-ink-muted">No TBR books match that filter.</Text>
            ) : (
              filtered.map((row) => {
                const book = row.books;
                const bookId = book?.id;
                const busy = movingId === bookId;
                return (
                  <Pressable
                    key={row.id}
                    disabled={!bookId || Boolean(movingId)}
                    onPress={() => onSelect(row)}
                    accessibilityRole="button"
                    accessibilityLabel={`${book?.title ?? "Untitled"}${book?.author ? ` by ${book.author}` : ""}`}
                    className="min-h-[44px] flex-row items-center gap-3 rounded-xl border border-brand-border bg-surface p-2 active:opacity-80"
                  >
                    <BookCover
                      url={book?.cover_url}
                      title={book?.title}
                      sizeClassName="w-12 h-[72px]"
                      saved
                    />
                    <View className="min-w-0 flex-1">
                      <Text className="text-sm font-semibold text-ink" numberOfLines={2}>
                        {book?.title ?? "Untitled"}
                      </Text>
                      {book?.author ? (
                        <Text className="mt-0.5 text-xs text-ink-muted" numberOfLines={1}>
                          {book.author}
                        </Text>
                      ) : null}
                      <View className="mt-1 self-start">
                        <ShelfBadge label="TBR" />
                      </View>
                    </View>
                    {busy ? <ActivityIndicator color="#642F37" /> : null}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}
