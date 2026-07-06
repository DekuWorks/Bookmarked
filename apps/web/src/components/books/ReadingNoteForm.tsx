"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import {
  READING_NOTE_CATEGORIES,
  READING_NOTE_VISIBILITY_OPTIONS,
} from "@/lib/readingNotes/categories";
import {
  createReadingNote,
  updateReadingNote,
  type ReadingNoteInput,
} from "@/lib/services/readingNotes";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import type { ReadingNote, ReadingNoteCategory, ReadingNoteVisibility } from "@/types";

type Props = {
  userBookId: string;
  initialNote?: ReadingNote;
  onSaved?: () => void;
  onCancel?: () => void;
};

export function ReadingNoteForm({ userBookId, initialNote, onSaved, onCancel }: Props) {
  const user = useAuthUser();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [quote, setQuote] = useState(initialNote?.quote ?? "");
  const [note, setNote] = useState(initialNote?.note ?? "");
  const [pageNumber, setPageNumber] = useState(
    initialNote?.page_number != null ? String(initialNote.page_number) : ""
  );
  const [chapter, setChapter] = useState(initialNote?.chapter ?? "");
  const [title, setTitle] = useState(initialNote?.title ?? "");
  const [category, setCategory] = useState<ReadingNoteCategory>(
    initialNote?.category ?? "general_note"
  );
  const [visibility, setVisibility] = useState<ReadingNoteVisibility>(
    initialNote?.visibility ?? "private"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const payload: ReadingNoteInput = {
      userBookId,
      quote: quote.trim() || null,
      note: note.trim() || null,
      pageNumber: pageNumber.trim() ? Number(pageNumber) : null,
      chapter: chapter.trim() || null,
      title: title.trim() || null,
      category,
      visibility,
    };

    if (!payload.quote && !payload.note) {
      toast.error("Add a quote or a reflection.");
      return;
    }

    setSaving(true);
    const result = initialNote
      ? await updateReadingNote(initialNote.id, payload)
      : await createReadingNote(user.id, payload);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(initialNote ? "Note updated." : "Note saved.");
    if (!initialNote) {
      setQuote("");
      setNote("");
      setPageNumber("");
      setChapter("");
      setTitle("");
      setCategory("general_note");
      setVisibility("private");
    }
    onSaved?.();
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
      <Textarea
        label="Quote"
        value={quote}
        onChange={(e) => setQuote(e.target.value)}
        placeholder="Paste a passage you want to remember…"
        className="min-h-[88px]"
      />
      <Textarea
        label="Note / reflection"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Your thoughts about this moment…"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Page"
          type="number"
          min={0}
          value={pageNumber}
          onChange={(e) => setPageNumber(e.target.value)}
          placeholder="e.g. 142"
        />
        <Input
          label="Chapter"
          value={chapter}
          onChange={(e) => setChapter(e.target.value)}
          placeholder="e.g. Chapter 12"
        />
      </div>
      <Input
        label="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Short label for this note"
      />
      <div>
        <label htmlFor="reading-note-category" className="mb-1.5 block text-sm font-medium text-text">
          Category
        </label>
        <select
          id="reading-note-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ReadingNoteCategory)}
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {READING_NOTE_CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.emoji} {item.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="reading-note-visibility" className="mb-1.5 block text-sm font-medium text-text">
          Visibility
        </label>
        <select
          id="reading-note-visibility"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as ReadingNoteVisibility)}
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {READING_NOTE_VISIBILITY_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="secondary" loading={saving}>
          {initialNote ? "Save changes" : "Add note"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
