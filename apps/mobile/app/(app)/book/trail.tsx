import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { BookTrailSessionList } from "../../../src/components/ReadingJournalSection";
import { LoadingState } from "../../../src/components/LoadingState";
import { ScreenHeader } from "../../../src/components/ScreenHeader";
import { getBookTrailPage } from "../../../src/services/readingSessions";
import { useAuthStore } from "../../../src/store/authStore";
import { BOOK_TRAIL_PAGE_SIZE, fullTrailBackTarget } from "../../../../../packages/utils/bookTrail";
import type { ReadingSession } from "../../../src/types";

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function BookTrailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const bookId = firstParam(params.id);
  const userId = useAuthStore((state) => state.user?.id);
  const back = fullTrailBackTarget("mobile", bookId || "missing");
  const [page, setPage] = useState(1);
  const [overrides, setOverrides] = useState<Record<string, ReadingSession>>({});

  const trail = useQuery({
    queryKey: ["book-trail", userId, bookId, page],
    queryFn: () => getBookTrailPage(userId as string, bookId, page),
    enabled: Boolean(userId) && Boolean(bookId),
  });

  const total = trail.data?.total ?? 0;
  const userBookId = trail.data?.userBookId ?? null;
  const sessions = (trail.data?.sessions ?? []).map((session) => overrides[session.id] ?? session);
  const totalPages = Math.max(1, Math.ceil(total / BOOK_TRAIL_PAGE_SIZE));
  const start = total === 0 ? 0 : (page - 1) * BOOK_TRAIL_PAGE_SIZE + 1;
  const end = Math.min(page * BOOK_TRAIL_PAGE_SIZE, total);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Trail" fallbackHref={bookId ? back.href : "/"} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 16 }}>
        {!bookId ? <Text className="text-sm text-ink-muted">No book selected.</Text> : null}
        {trail.data?.title ? <Text className="text-base font-semibold text-ink">{trail.data.title}</Text> : null}
        {total > 0 ? (
          <Text className="text-sm text-ink-muted">
            Showing {start}–{end} of {total} {total === 1 ? "session" : "sessions"}
          </Text>
        ) : null}
        {trail.isLoading ? <LoadingState message="Loading trail…" /> : null}
        {userBookId ? (
          <BookTrailSessionList
            sessions={sessions}
            userBookId={userBookId}
            total={total}
            pageStartIndex={(page - 1) * BOOK_TRAIL_PAGE_SIZE}
            onSessionUpdate={(updated) => setOverrides((current) => ({ ...current, [updated.id]: updated }))}
          />
        ) : !trail.isLoading && bookId ? (
          <Text className="text-sm text-ink-muted">Add this book to a shelf to keep a trail.</Text>
        ) : null}
        {totalPages > 1 ? (
          <View className="flex-row items-center justify-between gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous page"
              disabled={page <= 1}
              onPress={() => setPage((current) => Math.max(1, current - 1))}
              className="min-h-11 justify-center rounded-xl border border-brand-border px-4"
            >
              <Text className="text-sm font-semibold text-puce-red">Previous</Text>
            </Pressable>
            <Text className="text-sm text-ink-muted">
              Page {page} of {totalPages}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next page"
              disabled={page >= totalPages}
              onPress={() => setPage((current) => current + 1)}
              className="min-h-11 justify-center rounded-xl border border-brand-border px-4"
            >
              <Text className="text-sm font-semibold text-puce-red">Next</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
