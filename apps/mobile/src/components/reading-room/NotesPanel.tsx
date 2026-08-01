import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { BookCover } from "../BookCover";
import { LoadingState } from "../LoadingState";
import { SectionCard } from "../SectionCard";
import { READING_NOTE_CATEGORIES, type ReadingNoteWithBook } from "../../services/readingNotes";
import { formatNoteLocation } from "../../../../../packages/utils/readingNotes";

function categoryMeta(value: ReadingNoteWithBook["category"]) {
  return READING_NOTE_CATEGORIES.find((c) => c.value === value);
}

type Props = {
  notes: ReadingNoteWithBook[] | null;
};

export function NotesPanel({ notes }: Props) {
  const router = useRouter();

  return (
    <View className="gap-4">
      <SectionCard title="Search reading notes" emoji="🔍">
        <Text className="text-sm text-ink-muted">
          Find quotes and thoughts across your library.
        </Text>
        <Pressable
          onPress={() => router.push("/notes")}
          className="mt-3 self-start rounded-full bg-puce-red px-4 py-2 active:opacity-80"
        >
          <Text className="text-sm font-semibold text-white">Open notes search</Text>
        </Pressable>
      </SectionCard>

      <SectionCard title="Recent notes" emoji="🗒️">
        {notes === null ? (
          <LoadingState message="Loading notes…" />
        ) : notes.length === 0 ? (
          <Text className="text-sm text-ink-muted">Add notes from any book in your library.</Text>
        ) : (
          <View className="gap-3">
            {notes.map((note) => {
              const meta = categoryMeta(note.category);
              const location = formatNoteLocation(note);
              return (
                <Pressable
                  key={note.id}
                  onPress={() => note.book && router.push(`/book/${note.book.id}`)}
                  className="flex-row gap-3 rounded-xl border border-brand-border bg-background/70 p-3 active:opacity-80"
                >
                  {note.book ? (
                    <BookCover url={note.book.cover_url} title={note.book.title} sizeClassName="w-10 h-14" />
                  ) : null}
                  <View className="min-w-0 flex-1">
                    <Text className="text-xs font-semibold text-primary-dark">
                      {meta ? `${meta.emoji} ${meta.label}` : "Note"}
                    </Text>
                    {note.quote ? (
                      <Text className="mt-1 italic text-sm text-ink" numberOfLines={2}>
                        “{note.quote}”
                      </Text>
                    ) : null}
                    {note.note ? (
                      <Text className="mt-1 text-sm text-ink" numberOfLines={2}>
                        {note.note}
                      </Text>
                    ) : null}
                    {location ? (
                      <Text className="mt-1 text-xs text-ink-muted" numberOfLines={1}>
                        {location}
                      </Text>
                    ) : null}
                    {note.book ? (
                      <Text className="mt-1 text-xs text-ink-muted" numberOfLines={1}>
                        {note.book.title}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </SectionCard>
    </View>
  );
}
