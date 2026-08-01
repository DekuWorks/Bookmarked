import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, Text, TextInput, View } from "react-native";
import { LoadingState } from "../LoadingState";
import { SectionCard } from "../SectionCard";
import { useThemeColors } from "../../store/themeStore";
import type { UserReadingSession } from "../../services/readingSessions";
import {
  formatSessionDate,
  groupSessionsByBook,
  groupSessionsByReadNumber,
  sessionSummary,
  type BookSessionGroup,
} from "../../lib/readingRoomTrail";
import {
  DEFAULT_HISTORY_SORT,
  type HistorySortMode,
} from "../../../../../packages/utils/readingRoomHistory";
import { DEFAULT_PAGE_SIZE, paginateItems } from "../../../../../packages/utils/pagination";
import {
  filterTrailBookGroupsByQuery,
  sortTrailBookGroups,
} from "../../../../../packages/utils/readingRoomTrail";
import { HistorySortSelect } from "./HistorySortSelect";
import { BookListPagination } from "./BookListPagination";

type TrailView = "books" | "sessions" | "detail";

type Props = {
  sessions: UserReadingSession[] | null;
};

export function TrailPanel({ sessions }: Props) {
  const router = useRouter();
  const colors = useThemeColors();
  const [view, setView] = useState<TrailView>("books");
  const [selectedBookKey, setSelectedBookKey] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<HistorySortMode>(DEFAULT_HISTORY_SORT);
  const [page, setPage] = useState(1);

  const bookGroups = useMemo(
    () => (sessions ? groupSessionsByBook(sessions) : []),
    [sessions]
  );
  const filteredBookGroups = useMemo(
    () => filterTrailBookGroupsByQuery(bookGroups, searchQuery),
    [bookGroups, searchQuery]
  );
  const sortedBookGroups = useMemo(
    () => sortTrailBookGroups(filteredBookGroups, sort),
    [filteredBookGroups, sort]
  );
  // Reset to page 1 whenever the search/sort selection changes (adjust state during render
  // instead of a setState-in-effect — see https://react.dev/learn/you-might-not-need-an-effect).
  const bookPageResetKey = `${searchQuery}::${sort}`;
  const [prevBookPageResetKey, setPrevBookPageResetKey] = useState(bookPageResetKey);
  if (bookPageResetKey !== prevBookPageResetKey) {
    setPrevBookPageResetKey(bookPageResetKey);
    setPage(1);
  }

  const bookPage = useMemo(
    () => paginateItems(sortedBookGroups, page, DEFAULT_PAGE_SIZE),
    [sortedBookGroups, page]
  );

  const activeBook = bookGroups.find((group) => group.key === selectedBookKey) ?? null;
  const readGroups = useMemo(
    () => (activeBook ? groupSessionsByReadNumber(activeBook.sessions) : []),
    [activeBook]
  );
  const activeSession =
    activeBook?.sessions.find((session) => session.id === selectedSessionId) ?? null;

  function openBook(group: BookSessionGroup) {
    setSelectedBookKey(group.key);
    setSelectedSessionId(null);
    setView("sessions");
  }

  function openSession(sessionId: string) {
    setSelectedSessionId(sessionId);
    setView("detail");
  }

  function backToBooks() {
    setView("books");
    setSelectedBookKey(null);
    setSelectedSessionId(null);
  }

  function backToSessions() {
    setView("sessions");
    setSelectedSessionId(null);
  }

  if (sessions === null) {
    return (
      <SectionCard title="Trail" emoji="🥾">
        <LoadingState message="Loading trail…" />
      </SectionCard>
    );
  }

  if (!sessions.length) {
    return (
      <SectionCard title="Trail" emoji="🥾">
        <Text className="text-sm text-ink-muted">
          Save reading progress to build your trail.
        </Text>
      </SectionCard>
    );
  }

  if (view === "detail" && activeBook && activeSession) {
    return (
      <SectionCard title="Trail" emoji="🥾">
        <Pressable onPress={backToSessions} className="self-start active:opacity-80">
          <Text className="text-sm font-semibold text-primary-dark">← Back to sessions</Text>
        </Pressable>
        <View className="mt-4 rounded-xl border border-brand-border bg-background/70 px-4 py-4">
          <Text className="text-base font-semibold text-ink">{activeBook.bookTitle}</Text>
          {activeSession.read_number > 1 ? (
            <Text className="mt-1 text-xs font-medium text-puce-red">
              Read #{activeSession.read_number}
            </Text>
          ) : null}
          <Text className="mt-2 text-xs text-ink-muted">
            {formatSessionDate(activeSession.created_at)}
          </Text>
          <Text className="mt-2 text-sm text-ink-muted">{sessionSummary(activeSession)}</Text>
          <Text className="mt-1 text-sm text-ink-muted">
            {Math.round(activeSession.percent_complete)}% complete
          </Text>
          {activeSession.note ? (
            <Text className="mt-4 text-sm leading-relaxed text-ink">{activeSession.note}</Text>
          ) : (
            <Text className="mt-4 text-sm italic text-ink-muted">No note for this session.</Text>
          )}
          {activeSession.mood ? (
            <Text className="mt-3 text-xs text-ink-muted">Mood: {activeSession.mood}</Text>
          ) : null}
          {activeBook.bookId ? (
            <Pressable
              onPress={() => router.push(`/book/${activeBook.bookId}`)}
              className="mt-4 self-start active:opacity-80"
            >
              <Text className="text-sm font-semibold text-primary-dark">Open book ›</Text>
            </Pressable>
          ) : null}
        </View>
      </SectionCard>
    );
  }

  if (view === "sessions" && activeBook) {
    return (
      <SectionCard title="Trail" emoji="🥾">
        <Pressable onPress={backToBooks} className="self-start active:opacity-80">
          <Text className="text-sm font-semibold text-primary-dark">← Back to books</Text>
        </Pressable>
        <View className="mt-4">
          <Text className="text-base font-semibold text-ink">{activeBook.bookTitle}</Text>
          {activeBook.bookId ? (
            <Pressable
              onPress={() => router.push(`/book/${activeBook.bookId}`)}
              className="mt-1 self-start active:opacity-80"
            >
              <Text className="text-xs font-medium text-primary-dark">Open book</Text>
            </Pressable>
          ) : null}
        </View>
        <View className="mt-4 gap-4">
          {readGroups.map((readGroup) => (
            <View key={readGroup.readNumber} className="gap-2">
              {readGroups.length > 1 ? (
                <Text className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Read #{readGroup.readNumber}
                </Text>
              ) : null}
              {readGroup.sessions.map((session) => (
                <Pressable
                  key={session.id}
                  onPress={() => openSession(session.id)}
                  className="rounded-xl border border-brand-border bg-background/70 px-4 py-3 active:opacity-80"
                >
                  <View className="flex-row flex-wrap items-baseline justify-between gap-2">
                    <Text className="text-xs text-ink-muted">
                      {formatSessionDate(session.created_at)}
                    </Text>
                    <Text className="text-xs text-ink-muted">{sessionSummary(session)}</Text>
                  </View>
                  {session.note ? (
                    <Text className="mt-1 text-sm text-ink" numberOfLines={2}>
                      {session.note}
                    </Text>
                  ) : (
                    <Text className="mt-1 text-sm italic text-ink-muted">No note</Text>
                  )}
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Trail" emoji="🥾">
      <Text className="mb-3 text-sm text-ink-muted">Pick a book to view its session notes.</Text>
      <View className="relative">
        <TextInput
          accessibilityLabel="Search books"
          placeholder="Search by book title…"
          placeholderTextColor={colors.inkMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          className="rounded-xl border border-brand-border bg-background px-4 py-3 text-sm text-ink"
        />
      </View>
      <View className="mt-3">
        <HistorySortSelect value={sort} onChange={setSort} />
      </View>
      {bookPage.total === 0 ? (
        <Text className="mt-4 text-center text-sm text-ink-muted">No books match your search.</Text>
      ) : (
        <View className="mt-4 gap-2">
          {bookPage.pageItems.map((group) => (
            <Pressable
              key={group.key}
              onPress={() => openBook(group)}
              className="rounded-xl border border-brand-border bg-background/70 px-4 py-3 active:opacity-80"
            >
              <Text className="text-sm font-semibold text-ink">
                {group.bookTitle}
                <Text className="text-xs font-normal text-ink-muted">
                  {" "}
                  ({group.sessions.length} session{group.sessions.length === 1 ? "" : "s"})
                </Text>
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      <BookListPagination
        page={bookPage.page}
        totalPages={bookPage.totalPages}
        total={bookPage.total}
        pageSize={bookPage.pageSize}
        onPageChange={setPage}
        label="books"
      />
    </SectionCard>
  );
}
