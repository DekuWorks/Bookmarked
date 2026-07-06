"use client";

import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { getReadingNoteCategoryMeta } from "@/lib/readingNotes/categories";
import { bookDetailsNotesPath } from "@/lib/routes/book";
import type { ReadingNoteWithBook } from "@/lib/services/readingNotes";
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
  note: ReadingNoteWithBook;
};

export function NotesSearchResultCard({ note }: Props) {
  const categoryMeta = getReadingNoteCategoryMeta(note.category);
  const bookHref = note.book ? bookDetailsNotesPath(note.book.id) : null;

  return (
    <li className="rounded-xl border border-border bg-surface p-4 text-left shadow-sm">
      {note.book ? (
        <Link
          href={bookHref ?? "#"}
          className="mb-3 flex items-center gap-3 rounded-lg border border-border/70 bg-background/50 p-2 transition-colors hover:border-primary/40 hover:bg-background"
        >
          <div className="h-14 w-10 shrink-0 overflow-hidden rounded shadow-sm">
            <BookCover
              title={note.book.title}
              coverUrl={note.book.cover_url}
              className="h-full w-full"
              sizes="40px"
            />
          </div>
          <p className="line-clamp-2 text-sm font-semibold text-puce-red">{note.book.title}</p>
        </Link>
      ) : null}

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

      {bookHref ? (
        <p className="mt-3 text-sm">
          <Link href={bookHref} className="font-medium text-primary hover:underline">
            View on book page →
          </Link>
        </p>
      ) : null}
    </li>
  );
}
