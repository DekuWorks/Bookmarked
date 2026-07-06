"use client";

import { useEffect, useState } from "react";
import { NotesSearchResultCard } from "@/components/notes/NotesSearchResultCard";
import { LoadingState } from "@/components/ui/LoadingState";
import { searchNotesWithBooks, type ReadingNoteWithBook } from "@/lib/services/readingNotes";
import type { ReadingNoteCategory } from "@/types";

type Props = {
  userId: string;
  keyword?: string;
  category?: ReadingNoteCategory;
  pageNumber?: number;
};

export function NotesSearchResults({ userId, keyword, category, pageNumber }: Props) {
  const [notes, setNotes] = useState<ReadingNoteWithBook[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setNotes(null);
    setError(null);

    void searchNotesWithBooks({
      userId,
      keyword: keyword || undefined,
      category,
      pageNumber,
      limit: 50,
    }).then(({ notes: results, error: searchError }) => {
      if (cancelled) return;
      setNotes(results);
      setError(searchError ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, [userId, keyword, category, pageNumber]);

  if (notes === null) {
    return <LoadingState message="Searching your notes…" />;
  }

  if (error) {
    return (
      <div
        className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center"
        role="alert"
      >
        <p className="font-medium text-red-900">Could not search notes</p>
        <p className="mt-1 text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-background px-6 py-10 text-center text-sm text-text-muted">
        No notes match your search. Try different keywords or clear a filter.
      </p>
    );
  }

  return (
    <div className="space-y-4 text-left">
      <p className="text-center text-sm text-text-muted">
        {notes.length} {notes.length === 1 ? "note" : "notes"} found
      </p>
      <ul className="space-y-4">
        {notes.map((note) => (
          <NotesSearchResultCard key={note.id} note={note} />
        ))}
      </ul>
    </div>
  );
}
