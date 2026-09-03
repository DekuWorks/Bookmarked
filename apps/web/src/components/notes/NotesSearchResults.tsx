"use client";

import { useEffect, useState } from "react";
import { NotesSearchResultCard } from "@/components/notes/NotesSearchResultCard";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { searchNotesWithBooks, type ReadingNoteWithBook } from "@/lib/services/readingNotes";
import type { ReadingNoteCategory } from "@/types";
import {
  NOTES_BOOK_FILTER_COPY,
  notesEmptyMessage,
  sortNotesForBookFilter,
} from "@bookmarked/utils/notesBookFilter";

type Props = {
  userId: string;
  keyword?: string;
  category?: ReadingNoteCategory;
  pageNumber?: number;
  userBookId?: string | null;
};

export function NotesSearchResults({
  userId,
  keyword,
  category,
  pageNumber,
  userBookId,
}: Props) {
  const [notes, setNotes] = useState<ReadingNoteWithBook[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadId, setReloadId] = useState(0);
  const selectedUserBookId = userBookId ?? null;
  const requestKey = `${userId}::${keyword ?? ""}::${category ?? ""}::${pageNumber ?? ""}::${selectedUserBookId ?? ""}::${reloadId}`;
  const [prevRequestKey, setPrevRequestKey] = useState(requestKey);
  if (requestKey !== prevRequestKey) {
    setPrevRequestKey(requestKey);
    setNotes(null);
    setError(null);
  }

  useEffect(() => {
    let cancelled = false;

    void searchNotesWithBooks({
      userId,
      keyword: keyword || undefined,
      category,
      pageNumber,
      userBookId: selectedUserBookId ?? undefined,
      limit: 100,
    }).then(({ notes: results, error: searchError }) => {
      if (cancelled) return;
      if (searchError) {
        setNotes([]);
        setError(NOTES_BOOK_FILTER_COPY.error);
        return;
      }
      setNotes(sortNotesForBookFilter(results, selectedUserBookId));
    });

    return () => {
      cancelled = true;
    };
  }, [userId, keyword, category, pageNumber, selectedUserBookId, reloadId]);

  if (notes === null) {
    return <LoadingState message="Searching your notes…" />;
  }

  if (error) {
    return (
      <div
        className="space-y-3 rounded-xl border border-border bg-background px-6 py-8 text-center"
        role="alert"
      >
        <p className="text-sm text-text-muted">{NOTES_BOOK_FILTER_COPY.error}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setReloadId((id) => id + 1)}
        >
          {NOTES_BOOK_FILTER_COPY.retry}
        </Button>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-background px-6 py-10 text-center text-sm text-text-muted">
        {keyword || category || pageNumber
          ? "No notes match your search. Try different keywords or clear a filter."
          : notesEmptyMessage(selectedUserBookId)}
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
