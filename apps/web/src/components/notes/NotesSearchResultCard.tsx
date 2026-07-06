"use client";

import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { getReadingNoteCategoryMeta } from "@/lib/readingNotes/categories";
import {
  readingNoteBookLink,
  readingNoteCategoryPill,
  readingNoteQuote,
} from "@/lib/readingNotes/styles";
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
    <li className="rounded-xl border border-border bg-surface p-4 text-left shadow-sm transition-shadow hover:shadow-md sm:p-5">
      {note.book ? (
        <Link href={bookHref ?? "#"} className={readingNoteBookLink}>
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

      {bookHref ? (
        <p className="mt-4 border-t border-border/60 pt-3 text-sm">
          <Link
            href={bookHref}
            className="inline-flex min-h-[44px] items-center font-medium text-primary hover:underline"
          >
            View on book page →
          </Link>
        </p>
      ) : null}
    </li>
  );
}
