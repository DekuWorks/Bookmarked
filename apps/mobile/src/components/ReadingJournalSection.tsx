import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text, TextInput, View } from "react-native";
import { Button } from "./Button";
import { SessionMoodPicker } from "./SessionMoodPicker";
import { sessionMoodsFromRow } from "../../../../packages/utils/sessionMoods";
import {
  BOOK_TRAIL_PREVIEW_LIMIT,
  bookTrailSessionDisplay,
  filterBookTrailSessions,
  fullBookTrailHref,
  initialBookTrailOpen,
  sortBookTrailSessions,
} from "../../../../packages/utils/bookTrail";
import { updateReadingSession } from "../services/readingSessions";
import type { ReadingSession } from "../types";

function formatSessionDay(session: { created_at: string; session_date?: string | null }): string {
  const day = session.session_date?.slice(0, 10) ?? "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(`${day}T12:00:00`) : new Date(session.created_at);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sessionDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - sessionDay.getTime()) / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

type SessionNoteEditorProps = {
  session: ReadingSession;
  userBookId: string;
  oldest: boolean;
  onSaved: (session: ReadingSession) => void;
};

function SessionNoteEditor({ session, userBookId, oldest, onSaved }: SessionNoteEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(session.note ?? "");
  const [moods, setMoods] = useState(sessionMoodsFromRow(session));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const display = bookTrailSessionDisplay(session, { oldest });
  const sessionKey = `${session.id}:${session.note ?? ""}:${display.moods.join("|")}`;
  const [seenKey, setSeenKey] = useState(sessionKey);
  if (!editing && seenKey !== sessionKey) {
    setSeenKey(sessionKey);
    setDraft(session.note ?? "");
    setMoods(sessionMoodsFromRow(session));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await updateReadingSession(session.id, { note: draft, moods, userBookId });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.session) onSaved(result.session);
    setEditing(false);
  }

  async function handleMoodChange(nextMoods: string[]) {
    setMoods(nextMoods);
    setError(null);
    const result = await updateReadingSession(session.id, { moods: nextMoods, userBookId });
    if (result.error) {
      setError(result.error);
      setMoods(sessionMoodsFromRow(session));
      return;
    }
    if (result.session) onSaved(result.session);
  }

  return (
    <View className="mt-2 gap-2">
      {display.note && !editing ? (
        <Text className="text-sm italic text-ink-muted">“{display.note}”</Text>
      ) : null}
      <SessionMoodPicker values={moods} onChange={(value) => void handleMoodChange(value)} disabled={saving} />
      {editing ? (
        <View className="gap-2">
          <Text className="text-xs font-medium text-ink">Session note</Text>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={500}
            accessibilityLabel="Session note"
            placeholder="Thoughts from this reading session…"
            placeholderTextColor="#A99DAE"
            className="min-h-[72px] rounded-xl border border-brand-border bg-background px-3 py-2 text-sm text-ink"
          />
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button title={saving ? "Saving…" : "Save"} onPress={() => void handleSave()} />
            </View>
            <View className="flex-1">
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => {
                  setDraft(session.note ?? "");
                  setMoods(sessionMoodsFromRow(session));
                  setEditing(false);
                }}
              />
            </View>
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={display.note ? "Edit note" : "Add note"}
          onPress={() => {
            setDraft(session.note ?? "");
            setMoods(sessionMoodsFromRow(session));
            setEditing(true);
          }}
          className="min-h-11 justify-center active:opacity-80"
        >
          <Text className="text-sm font-medium text-primary-dark">{display.note ? "Edit note" : "Add note"}</Text>
        </Pressable>
      )}
      {error ? <Text className="text-sm text-rust">{error}</Text> : null}
    </View>
  );
}

type ListProps = {
  sessions: ReadingSession[];
  userBookId: string;
  total: number;
  pageStartIndex?: number;
  onSessionUpdate?: (session: ReadingSession) => void;
};

export function BookTrailSessionList({
  sessions,
  userBookId,
  total,
  pageStartIndex = 0,
  onSessionUpdate,
}: ListProps) {
  const visible = sortBookTrailSessions(filterBookTrailSessions(sessions, userBookId));
  if (!visible.length) {
    return <Text className="text-sm text-ink-muted">No reading sessions yet. Save progress to start your trail.</Text>;
  }

  return (
    <View className="gap-0">
      {visible.map((session, index) => {
        const oldest = pageStartIndex + index === total - 1 && total > 0;
        const display = bookTrailSessionDisplay(session, { oldest });
        return (
          <View key={session.id} className="border-l-2 border-primary/30 py-3 pl-4">
            <Text className="text-sm font-medium text-ink">{formatSessionDay(session)}</Text>
            <Text className="mt-0.5 text-sm text-ink-muted">{display.summary}</Text>
            <SessionNoteEditor
              session={session}
              userBookId={userBookId}
              oldest={oldest}
              onSaved={(updated) => onSessionUpdate?.(updated)}
            />
          </View>
        );
      })}
    </View>
  );
}

type Props = {
  bookId: string;
  userBookId: string;
  sessions: ReadingSession[];
  total: number;
  onSessionUpdate?: (session: ReadingSession) => void;
};

export function ReadingJournalSection({ bookId, userBookId, sessions, total, onSessionUpdate }: Props) {
  const router = useRouter();
  const params = useLocalSearchParams<{ trail?: string | string[] }>();
  const trailParam = firstParam(params.trail);
  const [open, setOpen] = useState(() => initialBookTrailOpen(trailParam));
  const [trackedParam, setTrackedParam] = useState(trailParam);
  const [rows, setRows] = useState(sessions);
  const [seenSessions, setSeenSessions] = useState(sessions);

  if (trailParam !== trackedParam) {
    setTrackedParam(trailParam);
    if (initialBookTrailOpen(trailParam)) setOpen(true);
  }
  if (sessions !== seenSessions) {
    setSeenSessions(sessions);
    setRows(sessions);
  }

  const preview = sortBookTrailSessions(filterBookTrailSessions(rows, userBookId)).slice(
    0,
    BOOK_TRAIL_PREVIEW_LIMIT
  );
  const countLabel = total === 1 ? "1 session" : `${total} sessions`;
  const disclosureLabel =
    total > 0
      ? `Trail, ${countLabel}, ${open ? "expanded" : "collapsed"}`
      : `Trail, ${open ? "expanded" : "collapsed"}`;

  function toggle() {
    const next = !open;
    setOpen(next);
    router.setParams({ trail: next ? "open" : "" });
  }

  function openFullTrail() {
    router.setParams({ trail: "open" });
    router.push(fullBookTrailHref("mobile", bookId) as never);
  }

  function handleSaved(updated: ReadingSession) {
    setRows((current) => current.map((session) => (session.id === updated.id ? updated : session)));
    onSessionUpdate?.(updated);
  }

  return (
    <View className="overflow-hidden rounded-2xl border border-brand-border bg-surface">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={disclosureLabel}
        onPress={toggle}
        className="min-h-11 flex-row items-center justify-between gap-3 p-4 active:opacity-80"
      >
        <View className="min-w-0 flex-1">
          <Text className="text-lg font-bold text-puce-red">Trail</Text>
          {total > 0 ? <Text className="mt-1 text-sm text-ink-muted">{countLabel}</Text> : null}
        </View>
        <Text
          accessibilityElementsHidden
          importantForAccessibility="no"
          className="text-lg text-ink-muted"
          style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}
        >
          ▾
        </Text>
      </Pressable>
      {open ? (
        <View className="border-t border-brand-border px-4 pb-4 pt-3">
          <BookTrailSessionList
            sessions={preview}
            userBookId={userBookId}
            total={total}
            onSessionUpdate={handleSaved}
          />
          {total > BOOK_TRAIL_PREVIEW_LIMIT ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View Full Trail, ${countLabel}`}
              onPress={openFullTrail}
              className="mt-4 min-h-11 items-center justify-center rounded-xl border border-brand-border active:opacity-80"
            >
              <Text className="text-sm font-semibold text-puce-red">View Full Trail · {countLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
