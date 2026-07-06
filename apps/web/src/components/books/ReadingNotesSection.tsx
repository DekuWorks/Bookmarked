"use client";

import { useCallback, useEffect, useState } from "react";
import { ReadingNoteCard } from "@/components/books/ReadingNoteCard";
import { ReadingNoteForm } from "@/components/books/ReadingNoteForm";
import { listNotesByBook } from "@/lib/services/readingNotes";
import type { ReadingNote } from "@/types";

type Props = {
  userBookId: string;
  loading?: boolean;
};

export function ReadingNotesSection({ userBookId, loading: externalLoading }: Props) {
  const [notes, setNotes] = useState<ReadingNote[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <section id="reading-notes" className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold text-puce-red">Reading notes</h2>
      <p className="mt-1 text-sm text-text-muted">
        Save quotes, reflections, and highlights — newest first.
      </p>

      <div className="mt-4 rounded-lg border border-border/70 bg-background/40 p-4">
        <h3 className="text-sm font-semibold text-text">Add a note</h3>
        <div className="mt-3">
          <ReadingNoteForm userBookId={userBookId} onSaved={() => void loadNotes()} />
        </div>
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm text-text-muted">Loading notes…</p>
      ) : notes.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">
          No notes yet. Capture a favorite quote or jot down a thought while you read.
        </p>
      ) : (
        <ol className="mt-4 space-y-0">
          {notes.map((note) => (
            <ReadingNoteCard
              key={note.id}
              note={note}
              userBookId={userBookId}
              onChange={() => void loadNotes()}
            />
          ))}
        </ol>
      )}
    </section>
  );
}
