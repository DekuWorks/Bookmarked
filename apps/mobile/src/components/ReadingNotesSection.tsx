import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "./Button";
import { FeatureLimitModal } from "./FeatureLimitModal";
import { NoteTag } from "./NoteTag";
import {
  createReadingNote,
  deleteReadingNote,
  listNotesByBook,
  updateReadingNote,
} from "../services/readingNotes";
import {
  createCustomNoteCategory,
  getReadingNoteCategoryMeta,
  listNoteCategories,
  type ReadingNoteCategoryMeta,
} from "../services/noteCategories";
import { isEntitlementLimitError } from "../utils/subscription";
import type { ReadingNote, ReadingNoteCategory, ReadingNoteVisibility } from "../types";
import { formatNoteLocation } from "../../../../packages/utils/noteLocation";

type Props = {
  userId: string;
  userBookId: string;
  initialNotes: ReadingNote[];
  onChanged?: () => void;
};

const VISIBILITY: { value: ReadingNoteVisibility; label: string }[] = [
  { value: "private", label: "Private" },
  { value: "friends_only", label: "Friends" },
  { value: "public", label: "Public" },
];

export function ReadingNotesSection({ userId, userBookId, initialNotes, onChanged }: Props) {
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState<ReadingNote[]>(initialNotes);
  const [categories, setCategories] = useState<ReadingNoteCategoryMeta[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ReadingNote | null>(null);

  const [category, setCategory] = useState<ReadingNoteCategory>("favorite_quote");
  const [quote, setQuote] = useState("");
  const [note, setNote] = useState("");
  const [page, setPage] = useState("");
  const [chapter, setChapter] = useState("");
  const [visibility, setVisibility] = useState<ReadingNoteVisibility>("private");
  const [newCategory, setNewCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  useEffect(() => {
    listNoteCategories(userId).then(setCategories);
  }, [userId]);

  async function refresh() {
    setNotes(await listNotesByBook(userBookId));
    onChanged?.();
  }

  function openNew() {
    setEditing(null);
    setCategory("favorite_quote");
    setQuote("");
    setNote("");
    setPage("");
    setChapter("");
    setVisibility("private");
    setNewCategory("");
    setEditorOpen(true);
  }

  function openEdit(existing: ReadingNote) {
    setEditing(existing);
    setCategory(existing.category as ReadingNoteCategory);
    setQuote(existing.quote ?? "");
    setNote(existing.note ?? "");
    setPage(existing.page_number != null ? String(existing.page_number) : "");
    setChapter(existing.chapter ?? "");
    setVisibility(existing.visibility);
    setNewCategory("");
    setEditorOpen(true);
  }

  async function addCategory() {
    const label = newCategory.trim();
    if (!label) return;
    const result = await createCustomNoteCategory(userId, label);
    if (result.error || !result.category) {
      Alert.alert("Couldn't add category", result.error ?? "Please try again.");
      return;
    }
    const merged = await listNoteCategories(userId);
    setCategories(merged);
    setCategory(`custom:${result.category.id}`);
    setNewCategory("");
  }

  async function save() {
    if (!quote.trim() && !note.trim()) {
      Alert.alert("Add a quote or a note", "A note needs at least a quote or some text.");
      return;
    }
    setSaving(true);
    const pageNumber = page.trim() ? Math.max(0, Number(page) || 0) : null;
    const payload = {
      userBookId,
      category,
      quote: quote.trim() || null,
      note: note.trim() || null,
      pageNumber,
      chapter: chapter.trim() || null,
      visibility,
    };
    const result = editing
      ? await updateReadingNote(editing.id, payload)
      : await createReadingNote(userId, payload);
    setSaving(false);
    if (result.error) {
      if (isEntitlementLimitError(result.error)) {
        setEditorOpen(false);
        setLimitOpen(true);
        return;
      }
      Alert.alert("Couldn't save note", result.error);
      return;
    }
    setEditorOpen(false);
    await refresh();
  }

  function confirmDelete(target: ReadingNote) {
    Alert.alert("Delete note", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const result = await deleteReadingNote(target.id);
          if (result.error) Alert.alert("Couldn't delete", result.error);
          else await refresh();
        },
      },
    ]);
  }

  return (
    <View>
      <FeatureLimitModal
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        featureLabel="Saved quotes"
        limitMessage="Free members can save 25 quotes. Upgrade to Bookmarked Plus for unlimited quote vault space."
      />
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-base font-bold text-puce-red">
          Reading notes {notes.length ? `(${notes.length})` : ""}
        </Text>
        <Pressable onPress={openNew} className="rounded-full bg-puce-red px-3 py-1.5 active:opacity-80">
          <Text className="text-sm font-semibold text-white">+ Add note</Text>
        </Pressable>
      </View>

      {notes.length === 0 ? (
        <Text className="text-ink-muted">
          Save quotes, theories, and thoughts as you read. Only you see private notes.
        </Text>
      ) : (
        notes.map((n) => {
          const meta = getReadingNoteCategoryMeta(n.category as ReadingNoteCategory, categories);
          const locationLabel = formatNoteLocation({
            pageNumber: n.page_number,
            chapterNumber: n.chapter,
          });
          return (
            <View key={n.id} className="mb-3 rounded-2xl border border-brand-border bg-surface p-3">
              <View className="flex-row items-center justify-between gap-2">
                <NoteTag
                  label={meta.label}
                  emoji={meta.emoji}
                  category={n.category}
                  isCustom={n.category.startsWith("custom:")}
                />
                <View className="flex-row gap-3">
                  <Pressable onPress={() => openEdit(n)}>
                    <Text className="text-xs font-medium text-primary-dark">Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => confirmDelete(n)}>
                    <Text className="text-xs text-rust">Delete</Text>
                  </Pressable>
                </View>
              </View>
              {n.quote ? (
                <Text className="mt-2 italic leading-5 text-ink">“{n.quote}”</Text>
              ) : null}
              {n.note ? <Text className="mt-2 leading-5 text-ink">{n.note}</Text> : null}
              {locationLabel ? (
                <Text className="mt-2 text-xs text-ink-muted">{locationLabel}</Text>
              ) : null}
            </View>
          );
        })
      )}

      <Modal
        visible={editorOpen}
        animationType="slide"
        onRequestClose={() => setEditorOpen(false)}
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-background">
          <View
            style={{ paddingTop: insets.top + 8 }}
            className="flex-row items-center justify-between border-b border-brand-border bg-surface px-4 pb-3"
          >
            <Pressable onPress={() => setEditorOpen(false)}>
              <Text className="text-base text-ink-muted">Cancel</Text>
            </Pressable>
            <Text className="text-lg font-bold text-puce-red">
              {editing ? "Edit note" : "New note"}
            </Text>
            <View className="w-12" />
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40, gap: 16 }}>
            <View>
              <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">
                Category
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                <View className="flex-row gap-2">
                  {categories.map((c) => {
                    const active = c.value === category;
                    return (
                      <Pressable
                        key={c.value}
                        onPress={() => setCategory(c.value)}
                        className={`flex-row items-center gap-1 rounded-full px-3 py-2 ${
                          active ? "bg-puce-red" : "bg-primary/15"
                        }`}
                      >
                        <Text>{c.emoji}</Text>
                        <Text className={`text-sm font-medium ${active ? "text-white" : "text-puce-red"}`}>
                          {c.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
              <View className="mt-2 flex-row items-center gap-2">
                <TextInput
                  value={newCategory}
                  onChangeText={setNewCategory}
                  placeholder="New category…"
                  placeholderTextColor="#A99DAE"
                  className="flex-1 rounded-xl border border-brand-border bg-surface px-3 py-2 text-sm text-ink"
                />
                <Pressable
                  onPress={addCategory}
                  disabled={!newCategory.trim()}
                  className={`rounded-xl px-3 py-2 ${newCategory.trim() ? "bg-primary/20" : "bg-primary/10"}`}
                >
                  <Text className="text-sm font-semibold text-puce-red">Add</Text>
                </Pressable>
              </View>
            </View>

            <View>
              <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">
                Quote
              </Text>
              <TextInput
                value={quote}
                onChangeText={setQuote}
                placeholder="A memorable line…"
                placeholderTextColor="#A99DAE"
                multiline
                className="min-h-[70px] rounded-xl border border-brand-border bg-surface px-3 py-3 text-base text-ink"
                style={{ textAlignVertical: "top" }}
              />
            </View>

            <View>
              <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">
                Note
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Your thoughts…"
                placeholderTextColor="#A99DAE"
                multiline
                className="min-h-[90px] rounded-xl border border-brand-border bg-surface px-3 py-3 text-base text-ink"
                style={{ textAlignVertical: "top" }}
              />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">
                  Page
                </Text>
                <TextInput
                  value={page}
                  onChangeText={setPage}
                  keyboardType="number-pad"
                  placeholder="—"
                  placeholderTextColor="#A99DAE"
                  className="rounded-xl border border-brand-border bg-surface px-3 py-3 text-base text-ink"
                />
              </View>
              <View className="flex-[2]">
                <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">
                  Chapter
                </Text>
                <TextInput
                  value={chapter}
                  onChangeText={setChapter}
                  placeholder="Optional"
                  placeholderTextColor="#A99DAE"
                  className="rounded-xl border border-brand-border bg-surface px-3 py-3 text-base text-ink"
                />
              </View>
            </View>

            <View>
              <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">
                Visibility
              </Text>
              <View className="flex-row gap-2">
                {VISIBILITY.map((v) => {
                  const active = v.value === visibility;
                  return (
                    <Pressable
                      key={v.value}
                      onPress={() => setVisibility(v.value)}
                      className={`flex-1 items-center rounded-xl py-2.5 ${
                        active ? "bg-puce-red" : "bg-primary/15"
                      }`}
                    >
                      <Text className={`text-sm font-medium ${active ? "text-white" : "text-puce-red"}`}>
                        {v.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Button title={editing ? "Save changes" : "Save note"} onPress={save} loading={saving} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
