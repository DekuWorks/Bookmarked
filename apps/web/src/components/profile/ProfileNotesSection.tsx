"use client";

import { useEffect, useState } from "react";
import { listPublicNotesForUser } from "@/lib/services/readingNotes";
import { getReadingNoteCategoryMeta } from "@/lib/readingNotes/categories";
import type { ReadingNote } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  userId: string;
};

/** Profile prep stub — public reading notes for a user (future profile tab). */
export function ProfileNotesSection({ userId }: Props) {
  const [notes, setNotes] = useState<ReadingNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void listPublicNotesForUser(userId).then((data) => {
      if (!cancelled) {
        setNotes(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return <p className="text-sm text-text-muted">Loading public notes…</p>;
  }

  if (notes.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        No public reading notes yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {notes.map((note) => {
        const categoryMeta = getReadingNoteCategoryMeta(note.category);
        return (
          <li key={note.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-text-muted" suppressHydrationWarning>
                {new Date(note.created_at).toLocaleDateString()}
                {note.page_number != null ? ` · Page ${note.page_number}` : ""}
              </p>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                  categoryMeta.tagClassName
                )}
              >
                <span aria-hidden>{categoryMeta.emoji}</span>
                {categoryMeta.label}
              </span>
            </div>
            {note.quote ? (
              <blockquote className="mt-2 text-sm italic text-text">
                &ldquo;{note.quote}&rdquo;
              </blockquote>
            ) : null}
            {note.note ? <p className="mt-2 text-sm text-text-muted">{note.note}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}
