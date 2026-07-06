"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { deleteReadingNote } from "@/lib/services/readingNotes";
import { getReadingNoteCategoryMeta } from "@/lib/readingNotes/categories";
import { ReadingNoteForm } from "@/components/books/ReadingNoteForm";
import type { ReadingNote } from "@/types";
import { cn } from "@/lib/utils/cn";

function formatNoteDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const noteDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - noteDay.getTime()) / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

type Props = {
  note: ReadingNote;
  userBookId: string;
  onChange?: () => void;
};

export function ReadingNoteCard({ note, userBookId, onChange }: Props) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const categoryMeta = getReadingNoteCategoryMeta(note.category);

  async function handleDelete() {
    if (!window.confirm("Delete this note?")) return;
    setDeleting(true);
    const result = await deleteReadingNote(note.id);
    setDeleting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Note deleted.");
    onChange?.();
  }

  if (editing) {
    return (
      <li className="relative border-l-2 border-primary/30 py-3 pl-4">
        <span className="absolute -left-[5px] top-4 h-2 w-2 rounded-full bg-royal-orange" />
        <ReadingNoteForm
          userBookId={userBookId}
          initialNote={note}
          onSaved={() => {
            setEditing(false);
            onChange?.();
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="relative border-l-2 border-primary/30 py-3 pl-4 first:pt-0 last:pb-0">
      <span className="absolute -left-[5px] top-4 h-2 w-2 rounded-full bg-royal-orange" />
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-medium text-text" suppressHydrationWarning>
            {formatNoteDate(note.created_at)}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
            {note.page_number != null ? <span>Page {note.page_number}</span> : null}
            {note.chapter ? <span>· {note.chapter}</span> : null}
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
            categoryMeta.tagClassName
          )}
        >
          <span aria-hidden>{categoryMeta.emoji}</span>
          {categoryMeta.label}
        </span>
      </div>

      {note.title ? (
        <h3 className="mt-2 text-sm font-semibold text-puce-red">{note.title}</h3>
      ) : null}

      {note.quote ? (
        <blockquote className="mt-2 border-l-4 border-primary/40 pl-3 text-sm italic text-text">
          &ldquo;{note.quote}&rdquo;
        </blockquote>
      ) : null}

      {note.note ? (
        <p className="mt-2 text-sm leading-relaxed text-text-muted whitespace-pre-wrap">
          {note.note}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          loading={deleting}
          onClick={() => void handleDelete()}
        >
          Delete
        </Button>
      </div>
    </li>
  );
}
