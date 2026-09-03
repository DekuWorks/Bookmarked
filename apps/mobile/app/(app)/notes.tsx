import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { BookCover } from "../../src/components/BookCover";
import { Button } from "../../src/components/Button";
import { EmptyState } from "../../src/components/EmptyState";
import { Input } from "../../src/components/Input";
import { LoadingState } from "../../src/components/LoadingState";
import { NoteTag } from "../../src/components/NoteTag";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import {
  NotesBookFilterButton,
  NotesBookFilterSheet,
} from "../../src/components/reading-room/NotesBookFilterSheet";
import {
  READING_NOTE_CATEGORIES,
  listNotedBooksForUser,
  searchNotesWithBooks,
} from "../../src/services/readingNotes";
import { TAB_BAR_SPACE, useTabBarScroll } from "../../src/navigation/TabBarScroll";
import { useAuthStore } from "../../src/store/authStore";
import type { ReadingNoteCategory } from "../../src/types";
import { formatNoteLocation } from "../../../../packages/utils/noteLocation";
import {
  NOTES_BOOK_FILTER_COPY,
  matchNotesBookFilter,
  notesEmptyMessage,
  sortNotesForBookFilter,
} from "../../../../packages/utils/notesBookFilter";

function categoryMeta(value: ReadingNoteCategory) {
  return READING_NOTE_CATEGORIES.find((c) => c.value === value);
}

export default function NotesScreen() {
  const router = useRouter();
  const { book: bookParam } = useLocalSearchParams<{ book?: string }>();
  const userId = useAuthStore((s) => s.user?.id);
  const { onScroll } = useTabBarScroll();
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<ReadingNoteCategory | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const bookOptions = useQuery({
    queryKey: ["noted-books", userId],
    queryFn: () => listNotedBooksForUser(userId as string),
    enabled: Boolean(userId),
  });
  const selectedUserBookId = useMemo(
    () => matchNotesBookFilter(Array.isArray(bookParam) ? bookParam[0] : bookParam, bookOptions.data?.options ?? []),
    [bookParam, bookOptions.data?.options]
  );

  const notes = useQuery({
    queryKey: ["notes", userId, keyword, category, selectedUserBookId],
    queryFn: () =>
      searchNotesWithBooks({
        userId,
        keyword: keyword.trim() || undefined,
        category: category ?? undefined,
        userBookId: selectedUserBookId ?? undefined,
        limit: 100,
      }),
    enabled: Boolean(userId),
  });
  const noteRows = useMemo(
    () => sortNotesForBookFilter(notes.data?.notes ?? [], selectedUserBookId),
    [notes.data?.notes, selectedUserBookId]
  );
  const notesError = notes.data?.error ?? bookOptions.data?.error ?? null;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Reading Notes" />
      <View className="bg-background px-4 pb-2">
        <Pressable
          onPress={() => router.push("/quote-graphics")}
          className="mb-3 self-start rounded-full bg-primary/15 px-3 py-1.5"
        >
          <Text className="text-sm font-semibold text-puce-red">Create quote graphic →</Text>
        </Pressable>
        <View className="mb-3">
          <NotesBookFilterButton
            options={bookOptions.data?.options ?? []}
            selectedUserBookId={selectedUserBookId}
            onPress={() => setPickerOpen(true)}
          />
        </View>
        <Input
          placeholder="Search your notes and quotes"
          autoCapitalize="none"
          value={keyword}
          onChangeText={setKeyword}
        />
        <Animated.ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-1">
          <Pressable
            onPress={() => setCategory(null)}
            className={`mr-2 rounded-full px-3 py-1.5 ${category === null ? "bg-puce-red" : "bg-primary/15"}`}
          >
            <Text className={`text-xs font-semibold ${category === null ? "text-white" : "text-puce-red"}`}>
              All
            </Text>
          </Pressable>
          {READING_NOTE_CATEGORIES.map((c) => {
            const active = category === c.value;
            return (
              <Pressable
                key={c.value}
                onPress={() => setCategory(c.value)}
                className={`mr-2 rounded-full px-3 py-1.5 ${active ? "bg-puce-red" : "bg-primary/15"}`}
              >
                <Text className={`text-xs font-semibold ${active ? "text-white" : "text-puce-red"}`}>
                  {c.emoji} {c.label}
                </Text>
              </Pressable>
            );
          })}
        </Animated.ScrollView>
      </View>

      {notes.isLoading || bookOptions.isLoading ? (
        <LoadingState message="Loading notes…" />
      ) : notesError ? (
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Text className="text-center text-sm text-ink-muted">
            {NOTES_BOOK_FILTER_COPY.error}
          </Text>
          <Button
            title={NOTES_BOOK_FILTER_COPY.retry}
            variant="ghost"
            onPress={() => {
              void notes.refetch();
              void bookOptions.refetch();
            }}
          />
        </View>
      ) : (
        <Animated.FlatList
          data={noteRows}
          keyExtractor={(item) => item.id}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE, flexGrow: 1 }}
          renderItem={({ item }) => {
            const meta = categoryMeta(item.category);
            const locationLabel = formatNoteLocation({
              pageNumber: item.page_number,
              chapterNumber: item.chapter,
            });
            return (
              <Pressable
                onPress={() => item.book && router.push(`/book/${item.book.id}`)}
                className="mb-3 flex-row gap-3 rounded-2xl border border-brand-border bg-surface p-3 active:opacity-80"
              >
                {item.book ? (
                  <BookCover url={item.book.cover_url} title={item.book.title} sizeClassName="w-12 h-16" />
                ) : null}
                <View className="flex-1 gap-1">
                  <NoteTag
                    label={meta?.label ?? "Note"}
                    emoji={meta?.emoji}
                    category={item.category}
                    isCustom={item.category.startsWith("custom:")}
                  />
                  {locationLabel ? (
                    <Text className="text-xs text-ink-muted">{locationLabel}</Text>
                  ) : null}
                  {item.quote ? (
                    <Text className="italic text-ink" numberOfLines={3}>
                      “{item.quote}”
                    </Text>
                  ) : null}
                  {item.note ? (
                    <Text className="text-ink" numberOfLines={3}>
                      {item.note}
                    </Text>
                  ) : null}
                  {item.book ? (
                    <Text className="text-xs text-ink-muted" numberOfLines={1}>
                      {item.book.title}
                      {item.book.author ? ` · ${item.book.author}` : ""}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              title={selectedUserBookId ? "No notes for this book" : "No notes yet"}
              description={notesEmptyMessage(selectedUserBookId)}
            />
          }
          ListFooterComponent={
            <Pressable
              onPress={() => router.push("/?tab=notes")}
              className="mt-4 items-center rounded-full border border-brand-border bg-surface px-4 py-3 active:opacity-80"
              accessibilityRole="button"
              accessibilityLabel="Return to Home Notes"
            >
              <Text className="text-sm font-semibold text-puce-red">Return to Home Notes</Text>
            </Pressable>
          }
        />
      )}

      <NotesBookFilterSheet
        visible={pickerOpen}
        options={bookOptions.data?.options ?? []}
        selectedUserBookId={selectedUserBookId}
        onClose={() => setPickerOpen(false)}
        onSelect={(userBookId) => {
          router.setParams({ book: userBookId ?? "" });
        }}
      />
    </View>
  );
}
