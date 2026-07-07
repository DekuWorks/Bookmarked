"use client";

import { useCallback, useEffect, useState } from "react";
import { ReadingNoteCard } from "@/components/books/ReadingNoteCard";
import { ReadingNoteForm } from "@/components/books/ReadingNoteForm";
import { readingNoteEmptyState } from "@/lib/readingNotes/styles";
import { listNotesByBook } from "@/lib/services/readingNotes";
import { Button } from "@/components/ui/Button";
import type { ReadingNote } from "@/types";

export const READING_NOTES_PREVIEW_LIMIT = 5;

type Props = {
  userBookId: string;
  loading?: boolean;
};

export function ReadingNotesSection({ userBookId, loading: externalLoading }: Props) {
  const [notes, setNotes] = useState<ReadingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    const data = await listNotesByBook(userBookId);
    setNotes(data);
    setLoading(false);
  }, [userBookId]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const isLoading = externalLoading || loading;
  const hasMoreNotes = notes.length > READING_NOTES_PREVIEW_LIMIT;
  const visibleNotes = expanded ? notes : notes.slice(0, READING_NOTES_PREVIEW_LIMIT);

  return (
    <section
      id="reading-notes"
      className="rounded-xl border border-border bg-surface p-5 sm:p-6"
    >
      <header className="border-b border-border/60 pb-4">
        <h2 className="text-lg font-semibold tracking-tight text-puce-red">Reading notes</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
          Save quotes, reflections, and highlights — newest first.
        </p>
      </header>

      <div className="mt-5 rounded-xl border border-border bg-background/50 p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-text">Add a note</h3>
        <div className="mt-4">
          <ReadingNoteForm userBookId={userBookId} onSaved={() => void loadNotes()} />
        </div>
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-text-muted">Loading notes…</p>
      ) : notes.length === 0 ? (
        <div className={`${readingNoteEmptyState} mt-6`}>
          <p className="text-sm font-medium text-text">No notes yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-text-muted">
            Capture a favorite quote or jot down a thought while you read. Your notes appear here
            in a journal-style timeline.
          </p>
        </div>
      ) : (
        <>
          <ol className="mt-6 space-y-0">
            {visibleNotes.map((note) => (
              <ReadingNoteCard
                key={note.id}
                note={note}
                userBookId={userBookId}
                onChange={() => void loadNotes()}
              />
            ))}
          </ol>
          {hasMoreNotes ? (
            <div className="mt-6 text-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-expanded={expanded}
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? "Show less" : "View all reading notes"}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
