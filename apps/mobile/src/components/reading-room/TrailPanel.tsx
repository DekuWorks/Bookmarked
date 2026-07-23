import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { LoadingState } from "../LoadingState";
import { SectionCard } from "../SectionCard";
import type { UserReadingSession } from "../../services/readingSessions";

type BookSessionGroup = {
  key: string;
  bookId: string | null;
  bookTitle: string;
  sessions: UserReadingSession[];
};

function groupSessionsByBook(sessions: UserReadingSession[]): BookSessionGroup[] {
  const groups = new Map<string, BookSessionGroup>();

  for (const session of sessions) {
    const key = session.bookId ?? session.bookTitle ?? session.id;
    const existing = groups.get(key);
    if (existing) {
      existing.sessions.push(session);
    } else {
      groups.set(key, {
        key,
        bookId: session.bookId,
        bookTitle: session.bookTitle ?? "Reading session",
        sessions: [session],
      });
    }
  }

  return [...groups.values()];
}

function formatSessionDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type Props = {
  sessions: UserReadingSession[] | null;
};

export function TrailPanel({ sessions }: Props) {
  const router = useRouter();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const bookGroups = useMemo(
    () => (sessions ? groupSessionsByBook(sessions) : []),
    [sessions]
  );
  const activeKey = selectedKey ?? bookGroups[0]?.key ?? null;
  const activeGroup = bookGroups.find((group) => group.key === activeKey);

  if (sessions === null) {
    return <LoadingState message="Loading trail…" />;
  }

  if (!sessions.length) {
    return (
      <SectionCard title="Journal" emoji="🥾">
        <Text className="text-sm text-ink-muted">
          Save reading progress to build your journal.
        </Text>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Journal" emoji="🥾">
      <Text className="mb-3 text-sm text-ink-muted">Pick a book to view its session notes.</Text>
      <View className="gap-2">
        {bookGroups.map((group) => {
          const active = activeKey === group.key;
          return (
            <Pressable
              key={group.key}
              onPress={() => setSelectedKey(group.key)}
              className={`rounded-xl border px-4 py-3 active:opacity-80 ${
                active ? "border-puce-red bg-primary/10" : "border-brand-border bg-background/70"
              }`}
            >
              <Text className={`text-sm font-semibold ${active ? "text-puce-red" : "text-ink"}`}>
                {group.bookTitle}
              </Text>
              <Text className="text-xs text-ink-muted">
                {group.sessions.length} session{group.sessions.length === 1 ? "" : "s"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activeGroup ? (
        <View className="mt-4 gap-3 border-t border-brand-border pt-4">
          {activeGroup.bookId ? (
            <Pressable onPress={() => router.push(`/book/${activeGroup.bookId}`)}>
              <Text className="text-sm font-semibold text-primary-dark">Open book ›</Text>
            </Pressable>
          ) : null}
          {activeGroup.sessions.map((session) => (
            <View
              key={session.id}
              className="rounded-xl border border-brand-border bg-background/70 px-4 py-3"
            >
              <Text className="text-xs text-ink-muted">{formatSessionDate(session.created_at)}</Text>
              <Text className="mt-1 text-sm text-ink-muted">
                Pages {session.page_start}–{session.page_end} ·{" "}
                {Math.round(session.percent_complete)}% complete
              </Text>
              <Text className="mt-2 text-sm text-ink">
                {session.note?.trim() ? session.note : "No note for this session."}
              </Text>
              {session.mood ? (
                <Text className="mt-2 text-xs text-ink-muted">Mood: {session.mood}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </SectionCard>
  );
}
