import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { BookCover } from "../BookCover";
import { Button } from "../Button";
import { LoadingState } from "../LoadingState";
import { SectionCard } from "../SectionCard";
import { NoteTag } from "../NoteTag";
import {
  NotesBookFilterButton,
  NotesBookFilterSheet,
} from "./NotesBookFilterSheet";
import {
  NOTES_BOOK_FILTER_COPY,
  matchNotesBookFilter,
  notesEmptyMessage,
  sortNotesForBookFilter,
  type NotesBookFilterOption,
} from "../../../../../packages/utils/notesBookFilter";
import { formatNoteLocation } from "../../../../../packages/utils/noteLocation";
import {
  READING_NOTE_CATEGORIES,
  listNotedBooksForUser,
  listRecentNotedBooksForHome,
  searchNotesWithBooks,
  type ReadingNoteWithBook,
} from "../../services/readingNotes";
import { HOME_RECENT_NOTES_COPY } from "../../../../../packages/utils/recentNotesByBook";

function categoryMeta(value: ReadingNoteWithBook["category"]) {
  return READING_NOTE_CATEGORIES.find((c) => c.value === value);
}

type Props = {
  userId: string;
  bookParam?: string | null;
  refreshId?: number;
};

export function NotesPanel({ userId, bookParam = null, refreshId = 0 }: Props) {
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [options, setOptions] = useState<NotesBookFilterOption[] | null>(null);
  const [notes, setNotes] = useState<ReadingNoteWithBook[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadId, setReloadId] = useState(0);

  const selectedUserBookId = useMemo(
    () => matchNotesBookFilter(bookParam, options ?? []),
    [bookParam, options]
  );

  const load = useCallback(async () => {
    setNotes(null);
    setError(null);
    const booksResult = await listNotedBooksForUser(userId);
    if (booksResult.error) {
      setOptions([]);
      setNotes([]);
      setError(booksResult.error);
      return;
    }
    setOptions(booksResult.options);
    const resolved = matchNotesBookFilter(bookParam, booksResult.options);
    const { notes: rows, error: notesError } = resolved
      ? await searchNotesWithBooks({
          userId,
          userBookId: resolved,
          limit: 100,
        })
      : await listRecentNotedBooksForHome(userId);
    if (notesError) {
      setNotes([]);
      setError(NOTES_BOOK_FILTER_COPY.error);
      return;
    }
    setNotes(sortNotesForBookFilter(rows, resolved));
  }, [userId, bookParam]);

  useEffect(() => {
    void load();
  }, [load, reloadId, refreshId]);

  function selectBook(userBookId: string | null) {
    router.setParams({ book: userBookId ?? "", tab: "notes" });
  }

  return (
    <View className="gap-4">
      <Pressable
        onPress={() => router.push("/notes")}
        className="self-stretch items-center rounded-full bg-puce-red px-4 py-3 active:opacity-80"
        accessibilityRole="button"
        accessibilityLabel="Open Full Notes Page"
      >
        <Text className="text-sm font-semibold text-white">Open Full Notes Page</Text>
      </Pressable>
      <Pressable
        onPress={() => router.push("/notes")}
        className="self-stretch items-center rounded-full border border-brand-border bg-surface px-4 py-3 active:opacity-80"
        accessibilityRole="button"
        accessibilityLabel="Open Notes Search"
      >
        <Text className="text-sm font-semibold text-puce-red">Open Notes Search</Text>
      </Pressable>

      <SectionCard title={selectedUserBookId ? "Notes" : HOME_RECENT_NOTES_COPY.title}>
        <View className="mb-3">
          <NotesBookFilterButton
            options={options ?? []}
            selectedUserBookId={selectedUserBookId}
            onPress={() => setPickerOpen(true)}
          />
        </View>

        {notes === null || options === null ? (
          <LoadingState message="Loading notes…" />
        ) : error ? (
          <View className="items-center gap-3 py-4">
            <Text className="text-center text-sm text-ink-muted">
              {NOTES_BOOK_FILTER_COPY.error}
            </Text>
            <Button
              title={NOTES_BOOK_FILTER_COPY.retry}
              variant="ghost"
              onPress={() => setReloadId((id) => id + 1)}
            />
          </View>
        ) : notes.length === 0 ? (
          <Text className="text-sm text-ink-muted">
            {selectedUserBookId
              ? notesEmptyMessage(selectedUserBookId)
              : HOME_RECENT_NOTES_COPY.empty}
          </Text>
        ) : (
          <View className="gap-3">
            {notes.map((note) => {
              const meta = categoryMeta(note.category);
              const locationLabel = formatNoteLocation({
                pageNumber: note.page_number,
                chapterNumber: note.chapter,
              });
              return (
                <Pressable
                  key={note.id}
                  onPress={() => note.book && router.push(`/book/${note.book.id}`)}
                  className="flex-row gap-3 rounded-xl border border-brand-border bg-background/70 p-3 active:opacity-80"
                >
                  {note.book ? (
                    <BookCover
                      url={note.book.cover_url}
                      title={note.book.title}
                      sizeClassName="w-10 h-14"
                    />
                  ) : null}
                  <View className="min-w-0 flex-1 gap-1">
                    <NoteTag
                      label={meta?.label ?? "Note"}
                      emoji={meta?.emoji}
                      category={note.category}
                      isCustom={note.category.startsWith("custom:")}
                    />
                    {locationLabel ? (
                      <Text className="text-xs text-ink-muted">{locationLabel}</Text>
                    ) : null}
                    {note.quote ? (
                      <Text className="italic text-sm text-ink" numberOfLines={2}>
                        “{note.quote}”
                      </Text>
                    ) : null}
                    {note.note ? (
                      <Text className="text-sm text-ink" numberOfLines={2}>
                        {note.note}
                      </Text>
                    ) : null}
                    {note.book ? (
                      <Text className="text-xs text-ink-muted" numberOfLines={1}>
                        {note.book.title}
                        {note.book.author ? ` · ${note.book.author}` : ""}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </SectionCard>

      <NotesBookFilterSheet
        visible={pickerOpen}
        options={options ?? []}
        selectedUserBookId={selectedUserBookId}
        onClose={() => setPickerOpen(false)}
        onSelect={selectBook}
      />
    </View>
  );
}
