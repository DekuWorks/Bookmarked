import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { CoverTile } from "../CoverTile";
import { LoadingState } from "../LoadingState";
import { SectionCard } from "../SectionCard";
import type { LibraryBookRow } from "../../services/library";
import type { UserReadingSession } from "../../services/readingSessions";
import {
  DEFAULT_HISTORY_SORT,
  HISTORY_PAGE_SIZE,
  HISTORY_PANEL_COPY,
  filterFinishedHistoryBooks,
  sortHistoryBooks,
  type HistorySortMode,
} from "../../../../../packages/utils/readingRoomHistory";
import { withOriginQuery } from "../../../../../packages/utils/navigationOrigin";
import { paginateItems } from "../../../../../packages/utils/pagination";
import { HistorySortSelect } from "./HistorySortSelect";
import { BookListPagination } from "./BookListPagination";

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

const TABLET_MIN_WIDTH = 768;

export function HistoryPanel({ books, sessions }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_MIN_WIDTH;
  const tileWidth = isTablet ? "w-[23%]" : "w-[31%]";
  const [sort, setSort] = useState<HistorySortMode>(DEFAULT_HISTORY_SORT);
  const [page, setPage] = useState(1);

  const sortedFinishedBooks = useMemo(
    () => sortHistoryBooks(filterFinishedHistoryBooks(books), sort),
    [books, sort]
  );
  // Reset to page 1 whenever the sort changes (adjust state during render instead of a
  // setState-in-effect — see https://react.dev/learn/you-might-not-need-an-effect).
  const [prevSort, setPrevSort] = useState(sort);
  if (sort !== prevSort) {
    setPrevSort(sort);
    setPage(1);
  }

  const finishedBooksPage = useMemo(
    () => paginateItems(sortedFinishedBooks, page, HISTORY_PAGE_SIZE),
    [sortedFinishedBooks, page]
  );

  return (
    <View className="gap-4">
      <SectionCard title={HISTORY_PANEL_COPY.title} shelfIconId="read">
        <View className="mt-1">
          <HistorySortSelect value={sort} onChange={setSort} />
        </View>

        {finishedBooksPage.total === 0 ? (
          <Text className="mt-4 text-sm text-ink-muted">Books you finish will appear here.</Text>
        ) : (
          <View className="mt-4 flex-row flex-wrap justify-between gap-y-3">
            {finishedBooksPage.pageItems.map((item) => (
              <CoverTile
                key={item.id}
                bookId={item.books?.id}
                title={item.books?.title}
                author={item.books?.author}
                coverUrl={item.books?.cover_url}
                saved
                isFavorite={item.is_favorite}
                widthClassName={tileWidth}
                coverSizeClassName="w-full aspect-[2/3]"
              />
            ))}
          </View>
        )}

        <BookListPagination
          page={finishedBooksPage.page}
          totalPages={finishedBooksPage.totalPages}
          total={finishedBooksPage.total}
          pageSize={finishedBooksPage.pageSize}
          onPageChange={setPage}
          label="finished books"
        />

        <Pressable
          onPress={() =>
            router.push(withOriginQuery("/library/read", { origin: "home_history" }))
          }
          className="mt-4 self-start active:opacity-80"
        >
          <Text className="text-sm font-semibold text-primary-dark">
            {HISTORY_PANEL_COPY.browseReadShelf} ›
          </Text>
        </Pressable>
      </SectionCard>

      {sessions === null ? (
        <LoadingState message="Loading sessions…" />
      ) : sessions.length > 0 ? (
        <SectionCard title={HISTORY_PANEL_COPY.recentSessions}>
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
