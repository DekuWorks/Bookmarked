import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { BookCover } from "../../src/components/BookCover";
import { EmptyState } from "../../src/components/EmptyState";
import { Input } from "../../src/components/Input";
import { LoadingState } from "../../src/components/LoadingState";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import {
  READING_NOTE_CATEGORIES,
  searchNotesWithBooks,
} from "../../src/services/readingNotes";
import { TAB_BAR_SPACE, useTabBarScroll } from "../../src/navigation/TabBarScroll";
import { useAuthStore } from "../../src/store/authStore";
import type { ReadingNoteCategory } from "../../src/types";

function categoryMeta(value: ReadingNoteCategory) {
  return READING_NOTE_CATEGORIES.find((c) => c.value === value);
}

export default function NotesScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const { onScroll } = useTabBarScroll();
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<ReadingNoteCategory | null>(null);

  const notes = useQuery({
    queryKey: ["notes", userId, keyword, category],
    queryFn: () =>
      searchNotesWithBooks({
        userId,
        keyword: keyword.trim() || undefined,
        category: category ?? undefined,
      }),
    enabled: Boolean(userId),
  });

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Reading Notes" />
      <View className="bg-surface px-4 pb-2">
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

      {notes.isLoading ? (
        <LoadingState message="Loading notes…" />
      ) : (
        <Animated.FlatList
          data={notes.data ?? []}
          keyExtractor={(item) => item.id}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE, flexGrow: 1 }}
          renderItem={({ item }) => {
            const meta = categoryMeta(item.category);
            return (
              <Pressable
                onPress={() => item.book && router.push(`/book/${item.book.id}`)}
                className="mb-3 flex-row gap-3 rounded-2xl border border-brand-border bg-surface p-3 active:opacity-80"
              >
                {item.book ? (
                  <BookCover url={item.book.cover_url} title={item.book.title} sizeClassName="w-12 h-16" />
                ) : null}
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-primary-dark">
                    {meta ? `${meta.emoji} ${meta.label}` : "Note"}
                  </Text>
                  {item.quote ? (
                    <Text className="mt-1 italic text-ink" numberOfLines={3}>
                      “{item.quote}”
                    </Text>
                  ) : null}
                  {item.note ? (
                    <Text className="mt-1 text-ink" numberOfLines={3}>
                      {item.note}
                    </Text>
                  ) : null}
                  {item.book ? (
                    <Text className="mt-1 text-xs text-ink-muted" numberOfLines={1}>
                      {item.book.title}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              title="No notes yet"
              description="Save favorite quotes and thoughts from a book's page."
            />
          }
        />
      )}
    </View>
  );
}
