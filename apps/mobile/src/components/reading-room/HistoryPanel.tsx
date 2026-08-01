import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { CoverTile } from "../CoverTile";
import { LoadingState } from "../LoadingState";
import { SectionCard } from "../SectionCard";
import type { LibraryBookRow } from "../../services/library";
import type { UserReadingSession } from "../../services/readingSessions";
import {
  DEFAULT_HISTORY_SORT,
  filterFinishedHistoryBooks,
  sortHistoryBooks,
  type HistorySortMode,
} from "../../../../../packages/utils/readingRoomHistory";
import { HistorySortSelect } from "./HistorySortSelect";

function formatSessionDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type Props = {
  books: LibraryBookRow[];
  sessions: UserReadingSession[] | null;
};

export function HistoryPanel({ books, sessions }: Props) {
  const router = useRouter();
  const [sort, setSort] = useState<HistorySortMode>(DEFAULT_HISTORY_SORT);

  const finishedBooks = useMemo(
    () => sortHistoryBooks(filterFinishedHistoryBooks(books), sort),
    [books, sort]
  );

  return (
    <View className="gap-4">
      <SectionCard title="Recently finished books and reading sessions" shelfIconId="read">
        <View className="mt-1">
          <HistorySortSelect value={sort} onChange={setSort} />
        </View>

        {finishedBooks.length === 0 ? (
          <Text className="mt-4 text-sm text-ink-muted">Books you finish will appear here.</Text>
        ) : (
          <FlatList
            horizontal
            data={finishedBooks}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, marginTop: 16 }}
            renderItem={({ item }) => (
              <CoverTile
                bookId={item.books?.id}
                title={item.books?.title}
                author={item.books?.author}
                coverUrl={item.books?.cover_url}
                saved
              />
            )}
          />
        )}

        <Pressable
          onPress={() => router.push("/library/read")}
          className="mt-4 self-start active:opacity-80"
        >
          <Text className="text-sm font-semibold text-primary-dark">Browse read shelf ›</Text>
        </Pressable>
      </SectionCard>

      {sessions === null ? (
        <LoadingState message="Loading sessions…" />
      ) : sessions.length > 0 ? (
        <SectionCard title="Recent sessions" emoji="📖">
          <View className="gap-2">
            {sessions.slice(0, 20).map((session) => (
              <View
                key={session.id}
                className="flex-row flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-border bg-background/70 px-3 py-2"
              >
                <Text className="text-sm font-medium text-ink">
                  {session.bookTitle ?? "Session"}
                </Text>
                <Text className="text-xs text-ink-muted">
                  {formatSessionDate(session.created_at)} · {session.pages_read} pages
                </Text>
              </View>
            ))}
          </View>
        </SectionCard>
      ) : null}
    </View>
  );
}
