import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { Button } from "./Button";
import { SectionCard } from "./SectionCard";
import { SessionMoodChip, SessionMoodPicker } from "./SessionMoodPicker";
import { updateReadingSession } from "../services/readingSessions";
import type { ReadingSession } from "../types";

export const READING_JOURNAL_PREVIEW_LIMIT = 5;

function formatSessionDay(iso: string): string {
  const date = new Date(iso);
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

function sessionLabel(session: ReadingSession, isOldest: boolean): string {
  const { page_start, page_end, pages_read, percent_complete } = session;

  if (isOldest && page_start === 0 && page_end > 0) {
    return `Started reading — page ${page_end} (${Math.round(percent_complete)}%)`;
  }

  if (page_end >= page_start && pages_read > 0) {
    if (page_start === page_end) {
      return `Read page ${page_end} (${Math.round(percent_complete)}%)`;
    }
    return `Read pages ${page_start} → ${page_end} (${pages_read} pages, ${Math.round(percent_complete)}%)`;
  }

  if (percent_complete >= 100) {
    return "Finished reading";
  }

  return `Progress updated — ${Math.round(percent_complete)}% complete`;
}

type SessionNoteEditorProps = {
  session: ReadingSession;
  onSaved: (session: ReadingSession) => void;
};

function SessionNoteEditor({ session, onSaved }: SessionNoteEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(session.note ?? "");
  const [mood, setMood] = useState(session.mood ?? null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await updateReadingSession(session.id, { note: draft, mood });
    setSaving(false);

    if (result.error) {
      Alert.alert("Error", result.error);
      return;
    }

    if (result.session) onSaved(result.session);
    setEditing(false);
  }

  async function handleMoodChange(nextMood: string | null) {
    setMood(nextMood);
    const result = await updateReadingSession(session.id, { mood: nextMood });
    if (result.error) {
      Alert.alert("Error", result.error);
      return;
    }
    if (result.session) onSaved(result.session);
  }

  if (!editing && !session.note && !session.mood) {
    return (
      <View className="mt-2 gap-2">
        <SessionMoodPicker value={mood} onChange={(value) => void handleMoodChange(value)} />
        <Pressable onPress={() => setEditing(true)} className="active:opacity-80">
          <Text className="text-xs font-medium text-primary-dark">Add note</Text>
        </Pressable>
      </View>
    );
  }

  if (!editing) {
    return (
      <View className="mt-1 gap-2">
        {session.mood ? <SessionMoodChip mood={session.mood} /> : null}
        {session.note ? (
          <Text className="text-sm italic text-ink-muted">“{session.note}”</Text>
        ) : null}
        <SessionMoodPicker value={mood} onChange={(value) => void handleMoodChange(value)} />
        <Pressable
          onPress={() => {
            setDraft(session.note ?? "");
            setMood(session.mood ?? null);
            setEditing(true);
          }}
          className="active:opacity-80"
        >
          <Text className="text-xs font-medium text-primary-dark">Edit note</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="mt-2 gap-2">
      <SessionMoodPicker value={mood} onChange={setMood} disabled={saving} />
      <TextInput
        value={draft}
        onChangeText={setDraft}
        multiline
        maxLength={500}
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
              setMood(session.mood ?? null);
              setEditing(false);
            }}
          />
        </View>
      </View>
    </View>
  );
}

type Props = {
  sessions: ReadingSession[];
  loading?: boolean;
  onSessionUpdate?: (session: ReadingSession) => void;
};

export function ReadingJournalSection({ sessions, loading, onSessionUpdate }: Props) {
  const [expanded, setExpanded] = useState(false);
  const chronological = [...sessions].reverse();
  const oldestId = chronological[0]?.id;
  const hasMoreSessions = sessions.length > READING_JOURNAL_PREVIEW_LIMIT;
  const visibleSessions = expanded ? sessions : sessions.slice(0, READING_JOURNAL_PREVIEW_LIMIT);

  const badge = loading
    ? undefined
    : sessions.length === 0
      ? "Empty"
      : `${sessions.length} ${sessions.length === 1 ? "entry" : "entries"}`;

  return (
    <SectionCard title="Trail" emoji="🥾" action={badge ? <Text className="text-xs text-ink-muted">{badge}</Text> : undefined}>
      <Text className="mb-3 text-sm text-ink-muted">
        Your reading history for this book — newest first.
      </Text>

      {loading ? (
        <Text className="text-sm text-ink-muted">Loading trail…</Text>
      ) : sessions.length === 0 ? (
        <Text className="text-sm text-ink-muted">
          No reading sessions yet. Save progress to start your trail.
        </Text>
      ) : (
        <>
          <View className="gap-0">
            {visibleSessions.map((session) => (
              <View
                key={session.id}
                className="border-l-2 border-primary/30 py-3 pl-4"
              >
                <Text className="text-sm font-medium text-ink">{formatSessionDay(session.created_at)}</Text>
                <Text className="mt-0.5 text-sm text-ink-muted">
                  {sessionLabel(session, session.id === oldestId)}
                </Text>
                <SessionNoteEditor
                  session={session}
                  onSaved={(updated) => onSessionUpdate?.(updated)}
                />
              </View>
            ))}
          </View>
          {hasMoreSessions ? (
            <Pressable
              onPress={() => setExpanded((value) => !value)}
              className="mt-4 items-center rounded-xl border border-brand-border py-2 active:opacity-80"
            >
              <Text className="text-sm font-semibold text-puce-red">
                {expanded ? "Show less" : "View full Trail"}
              </Text>
            </Pressable>
          ) : null}
        </>
      )}
    </SectionCard>
  );
}
