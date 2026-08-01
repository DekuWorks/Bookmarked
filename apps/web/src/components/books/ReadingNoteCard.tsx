"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { deleteReadingNote } from "@/lib/services/readingNotes";
import { getReadingNoteCategoryMeta } from "@/lib/readingNotes/categories";
import { useReadingNoteCategories } from "@/lib/hooks/useReadingNoteCategories";
import {
  readingNoteCategoryPill,
  readingNoteQuote,
  readingNoteTimelineDot,
  readingNoteTimelineItem,
} from "@/lib/readingNotes/styles";
import { ReadingNoteForm } from "@/components/books/ReadingNoteForm";
import type { ReadingNote } from "@/types";
import { cn } from "@/lib/utils/cn";
import { formatNoteLocation } from "@bookmarked/utils/readingNotes";

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
  const { customLookup } = useReadingNoteCategories(note.user_id);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const categoryMeta = getReadingNoteCategoryMeta(note.category, customLookup);
  const location = formatNoteLocation(note);

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
      <li className={cn(readingNoteTimelineItem, "pb-6")}>
        <span className={readingNoteTimelineDot} aria-hidden />
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
    <li className={readingNoteTimelineItem}>
      <span className={readingNoteTimelineDot} aria-hidden />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-text" suppressHydrationWarning>
            {formatNoteDate(note.created_at)}
          </p>
          {location ? (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-muted">
              <span>{location}</span>
            </div>
          ) : null}
        </div>
        <span
          className={cn(readingNoteCategoryPill, "shrink-0", categoryMeta.tagClassName)}
        >
          <span aria-hidden>{categoryMeta.emoji}</span>
          {categoryMeta.label}
        </span>
      </div>

      {note.title ? (
        <h3 className="mt-3 text-sm font-semibold tracking-tight text-puce-red">{note.title}</h3>
      ) : null}

      {note.quote ? (
        <blockquote className={readingNoteQuote}>&ldquo;{note.quote}&rdquo;</blockquote>
      ) : null}

      {note.note ? (
        <p className="mt-3 text-sm leading-relaxed text-text-muted whitespace-pre-wrap">
          {note.note}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-[44px] min-w-[44px] px-3"
          onClick={() => setEditing(true)}
        >
          Edit
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-[44px] min-w-[44px] px-3"
          loading={deleting}
          onClick={() => void handleDelete()}
        >
          Delete
        </Button>
      </div>
    </li>
  );
}
