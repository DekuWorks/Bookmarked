"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookCover } from "@/components/books/BookCover";
import { listProfileNotesForUser, type ReadingNoteWithBook } from "@/lib/services/readingNotes";
import {
  getReadingNoteCategoryMeta,
  READING_NOTE_VISIBILITY_OPTIONS,
} from "@/lib/readingNotes/categories";
import { useReadingNoteCategories } from "@/lib/hooks/useReadingNoteCategories";
import {
  readingNoteBookLink,
  readingNoteCategoryPill,
  readingNoteEmptyState,
  readingNoteQuote,
  readingNoteTimelineDot,
  readingNoteTimelineItem,
} from "@/lib/readingNotes/styles";
import { bookDetailsNotesPath } from "@/lib/routes/book";
import { cn } from "@/lib/utils/cn";
import type { ReadingNoteVisibility } from "@/types";

type Props = {
  userId: string;
  isOwnProfile?: boolean;
};

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

function visibilityLabel(visibility: ReadingNoteVisibility): string {
  return (
    READING_NOTE_VISIBILITY_OPTIONS.find((option) => option.value === visibility)?.label ??
    visibility
  );
}

function visibilityBadgeClass(visibility: ReadingNoteVisibility): string {
  switch (visibility) {
    case "public":
      return "bg-green-100 text-green-900 border-green-300";
    case "friends_only":
      return "bg-blue-100 text-blue-900 border-blue-300";
    default:
      return "bg-surface text-text-muted border-border";
  }
}

function ProfileNoteCard({
  note,
  showVisibility,
}: {
  note: ReadingNoteWithBook;
  showVisibility: boolean;
}) {
  const { customLookup } = useReadingNoteCategories(note.user_id);
  const categoryMeta = getReadingNoteCategoryMeta(note.category, customLookup);
  const bookHref = note.book ? bookDetailsNotesPath(note.book.id) : null;

  return (
    <li className={readingNoteTimelineItem}>
      <span className={readingNoteTimelineDot} aria-hidden />

      {note.book ? (
        <Link href={bookHref ?? "#"} className={readingNoteBookLink}>
          <div className="h-14 w-10 shrink-0 overflow-hidden rounded shadow-sm">
            <BookCover
              title={note.book.title}
              coverUrl={note.book.cover_url}
              className="h-full w-full"
              sizes="40px"
              bookmarked
              bookmarkBadgeSize="sm"
            />
          </div>
          <p className="line-clamp-2 text-sm font-semibold text-puce-red">{note.book.title}</p>
        </Link>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-text" suppressHydrationWarning>
            {formatNoteDate(note.created_at)}
          </p>
          {(note.page_number != null || note.chapter) && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-muted">
              {note.page_number != null ? <span>Page {note.page_number}</span> : null}
              {note.page_number != null && note.chapter ? (
                <span aria-hidden className="text-border">
                  ·
                </span>
              ) : null}
              {note.chapter ? <span>{note.chapter}</span> : null}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {showVisibility ? (
            <span
              className={cn(
                readingNoteCategoryPill,
                visibilityBadgeClass(note.visibility)
              )}
            >
              {visibilityLabel(note.visibility)}
            </span>
          ) : null}
          <span
            className={cn(readingNoteCategoryPill, "shrink-0", categoryMeta.tagClassName)}
          >
            <span aria-hidden>{categoryMeta.emoji}</span>
            {categoryMeta.label}
          </span>
        </div>
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
    </li>
  );
}

export function ProfileNotesSection({ userId, isOwnProfile = false }: Props) {
  const [notes, setNotes] = useState<ReadingNoteWithBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void listProfileNotesForUser(userId, { isOwnProfile }).then((data) => {
      if (!cancelled) {
        setNotes(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId, isOwnProfile]);

  if (loading) {
    return <p className="text-sm text-text-muted">Loading reading notes…</p>;
  }

  if (notes.length === 0) {
    return (
      <div className={readingNoteEmptyState}>
        <p className="text-sm font-medium text-text">
          {isOwnProfile ? "No reading notes yet" : "No reading notes to show"}
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-text-muted">
          {isOwnProfile
            ? "Add notes from any book in your library — quotes and reflections show up here."
            : "Notes from this reader will appear here when they share them."}
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-0">
      {notes.map((note) => (
        <ProfileNoteCard key={note.id} note={note} showVisibility={isOwnProfile} />
      ))}
    </ol>
  );
}
