import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookCover } from "../../../src/components/BookCover";
import { EmptyState } from "../../../src/components/EmptyState";
import { LoadingState } from "../../../src/components/LoadingState";
import { ScreenGradientWash } from "../../../src/components/ScreenGradientWash";
import { ScreenHeader } from "../../../src/components/ScreenHeader";
import { useLibraryBooks } from "../../../src/hooks/useLibrary";
import { TAB_BAR_SPACE, useTabBarScroll } from "../../../src/navigation/TabBarScroll";
import type { LibraryBookRow } from "../../../src/services/library";
import {
  LIBRARY_FILTER_OPTIONS,
  libraryGridColumnCount,
  parseLibraryFilter,
  type LibraryFilterId,
} from "../../../../../packages/utils/libraryFilters";
import { withOriginQuery } from "../../../../../packages/utils/navigationOrigin";
import { resolveTrackingFormat } from "../../../../../packages/utils/listeningTime";

type SortKey =
  | "date_added"
  | "author_az"
  | "author_za"
  | "title_az"
  | "title_za"
  | "genre"
  | "date_to_read";

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "date_added", label: "Date Added" },
  { id: "author_az", label: "Author (A–Z)" },
  { id: "author_za", label: "Author (Z–A)" },
  { id: "title_az", label: "Title (A–Z)" },
  { id: "title_za", label: "Title (Z–A)" },
  { id: "genre", label: "Genre" },
  { id: "date_to_read", label: "Date to Read" },
];

function isDnf(row: LibraryBookRow): boolean {
  return row.dnf || (row.completion_tags ?? []).some((t) => t.toLowerCase() === "dnf");
}

function matchesTab(row: LibraryBookRow, tab: LibraryFilterId): boolean {
  switch (tab) {
    case "finished":
      return row.shelf_status === "read" && !isDnf(row);
    case "currently_reading":
      return row.shelf_status === "currently_reading" && !isDnf(row);
    case "tbr":
      return row.shelf_status === "want_to_read";
    case "dnf":
      return isDnf(row);
    case "all":
    default:
      return true;
  }
}

function sortBooks(rows: LibraryBookRow[], sort: SortKey): LibraryBookRow[] {
  const copy = [...rows];
  const title = (r: LibraryBookRow) => r.books?.title ?? "";
  const author = (r: LibraryBookRow) => r.books?.author ?? "";
  const genre = (r: LibraryBookRow) => r.books?.subjects?.[0] ?? "";
  switch (sort) {
    case "author_az":
      return copy.sort((a, b) => author(a).localeCompare(author(b), undefined, { sensitivity: "base" }));
    case "author_za":
      return copy.sort((a, b) => author(b).localeCompare(author(a), undefined, { sensitivity: "base" }));
    case "title_az":
      return copy.sort((a, b) => title(a).localeCompare(title(b), undefined, { sensitivity: "base" }));
    case "title_za":
      return copy.sort((a, b) => title(b).localeCompare(title(a), undefined, { sensitivity: "base" }));
    case "genre":
      return copy.sort((a, b) => genre(a).localeCompare(genre(b), undefined, { sensitivity: "base" }));
    case "date_to_read":
      return copy.sort((a, b) => {
        const av = a.expected_read_date
          ? new Date(a.expected_read_date).getTime()
          : Number.POSITIVE_INFINITY;
        const bv = b.expected_read_date
          ? new Date(b.expected_read_date).getTime()
          : Number.POSITIVE_INFINITY;
        return av - bv;
      });
    case "date_added":
    default:
      return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

function formatAdded(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(-2)}`;
}

function BookRow({ row }: { row: LibraryBookRow }) {
  const router = useRouter();
  const book = row.books;
  if (!book) return null;
  return (
    <Pressable
      onPress={() => router.push(`/book/${book.id}?origin=library_all_books`)}
      className="flex-row items-center gap-3 border-b border-brand-border py-3 active:opacity-80"
    >
      <BookCover url={book.cover_url} title={book.title} sizeClassName="w-12 h-16" saved badgeSize="medium" />
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text className="font-semibold text-ink" numberOfLines={1}>
            {book.title}
          </Text>
          {resolveTrackingFormat({
            userFormat: row.tracking_format,
            catalogFormat: book.format,
          }) === "audiobook" ? (
            <Text className="text-xs">🎧</Text>
          ) : null}
        </View>
        {book.author ? (
          <Text className="text-sm text-ink-muted" numberOfLines={1}>
            {book.author}
          </Text>
        ) : null}
        {book.subjects?.length ? (
          <Text className="text-xs text-ink-muted" numberOfLines={1}>
            {book.subjects.slice(0, 2).join(", ")}
          </Text>
        ) : null}
      </View>
      <View className="items-end">
        <Text className="text-xs text-ink-muted">Added</Text>
        <Text className="text-xs text-ink-muted">{formatAdded(row.created_at)}</Text>
        <Text className="mt-1 text-lg text-ink-muted">⋯</Text>
      </View>
    </Pressable>
  );
}

function BookGridTile({ row, columns }: { row: LibraryBookRow; columns: number }) {
  const router = useRouter();
  const book = row.books;
  if (!book) return null;
  return (
    <Pressable
      onPress={() => router.push(`/book/${book.id}?origin=library_all_books`)}
      className={`mb-4 items-center px-1 active:opacity-80 ${columns >= 4 ? "w-1/4" : "w-1/3"}`}
    >
      <BookCover url={book.cover_url} title={book.title} sizeClassName="w-24 h-36" saved badgeSize="medium" />
      <Text className="mt-1 w-full text-center text-xs font-medium text-ink" numberOfLines={2}>
        {book.title}
      </Text>
    </Pressable>
  );
}

export default function MyBooksScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { onScroll } = useTabBarScroll();
  const { data: books, isLoading, isError, error } = useLibraryBooks();
  const [tab, setTab] = useState<LibraryFilterId>("all");
  const [sort, setSort] = useState<SortKey>("date_added");
  const [grid, setGrid] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const columns = libraryGridColumnCount(width, grid);

  const rows = useMemo(() => {
    const filtered = (books ?? []).filter((b) => matchesTab(b, tab));
    return sortBooks(filtered, sort);
  }, [books, tab, sort]);

  const activeSortLabel = SORT_OPTIONS.find((o) => o.id === sort)?.label ?? "Date Added";

  return (
    <View className="flex-1 bg-background">
      <ScreenGradientWash />
      <ScreenHeader
        title="All Books"
        right={
          <Pressable
            onPress={() =>
              router.push(withOriginQuery("/search", { origin: "library_all_books" }) as never)
            }
            accessibilityLabel="Add a book"
            className="h-10 w-10 items-center justify-center rounded-full bg-puce-red active:opacity-80"
          >
            <Text className="text-2xl font-light leading-6 text-white">+</Text>
          </Pressable>
        }
      />
      <View className="px-4 pb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-1">
          <View className="flex-row">
            {LIBRARY_FILTER_OPTIONS.map((t) => {
              const active = t.id === tab;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setTab(parseLibraryFilter(t.id))}
                  className="mr-5 pb-2"
                >
                  <Text className={active ? "font-bold text-puce-red" : "font-medium text-ink-muted"}>
                    {t.label}
                  </Text>
                  {active ? <View className="mt-1 h-0.5 rounded-full bg-puce-red" /> : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center">
          <Text className="mr-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Sort by
          </Text>
          <Pressable
            onPress={() => setSortOpen(true)}
            className="flex-row items-center rounded-lg border border-brand-border bg-surface px-3 py-1.5 active:opacity-80"
          >
            <Text className="mr-1 text-sm font-medium text-ink">{activeSortLabel}</Text>
            <Text className="text-ink-muted">▾</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={() => setGrid((g) => !g)}
          accessibilityLabel={grid ? "List view" : "Grid view"}
          className="h-9 w-9 items-center justify-center rounded-lg border border-brand-border bg-surface active:opacity-80"
        >
          <Text className="text-base text-puce-red">{grid ? "≣" : "▦"}</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <LoadingState message="Loading your books…" />
      ) : isError ? (
        <EmptyState
          title="Couldn't load your books"
          description={error instanceof Error ? error.message : "Please try again."}
        />
      ) : (
        <Animated.FlatList
          key={grid ? `grid-${columns}` : "list"}
          data={rows}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: TAB_BAR_SPACE }}
          renderItem={({ item }) =>
            grid ? <BookGridTile row={item} columns={columns} /> : <BookRow row={item} />
          }
          ListEmptyComponent={
            <EmptyState
              title="No books here yet"
              description="Add books from Discover to fill this shelf."
            />
          }
        />
      )}

      <Modal transparent visible={sortOpen} animationType="fade" onRequestClose={() => setSortOpen(false)}>
        <Pressable className="flex-1 bg-black/20" onPress={() => setSortOpen(false)}>
          <View style={{ marginTop: insets.top + 150 }} className="mx-6 rounded-2xl bg-surface p-2 shadow-lg">
            {SORT_OPTIONS.map((o) => {
              const active = o.id === sort;
              return (
                <Pressable
                  key={o.id}
                  onPress={() => {
                    setSort(o.id);
                    setSortOpen(false);
                  }}
                  className="flex-row items-center justify-between rounded-xl px-4 py-3 active:bg-primary/10"
                >
                  <Text className={active ? "font-semibold text-puce-red" : "text-ink"}>{o.label}</Text>
                  {active ? <Text className="text-puce-red">✓</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
