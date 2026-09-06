"use client";

import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { getReadingNoteCategoryMeta } from "@/lib/readingNotes/categories";
import { useReadingNoteCategories } from "@/lib/hooks/useReadingNoteCategories";
import {
  readingNoteBookLink,
  readingNoteQuote,
} from "@/lib/readingNotes/styles";
import { NoteTag } from "@/components/notes/NoteTag";
import { bookDetailsNotesPath } from "@/lib/routes/book";
import type { ReadingNoteWithBook } from "@/lib/services/readingNotes";
import { formatNoteLocation } from "@bookmarked/utils/noteLocation";
import { isCustomReadingNoteCategory } from "@/lib/readingNotes/categories";
import { ShareNoteButton } from "@/components/notes/ShareNoteButton";

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
  const { customLookup } = useReadingNoteCategories(note.user_id);
  const categoryMeta = getReadingNoteCategoryMeta(note.category, customLookup);
  const bookHref = note.book ? bookDetailsNotesPath(note.book.id) : null;
  const locationLabel = formatNoteLocation({
    pageNumber: note.page_number,
    chapterNumber: note.chapter,
  });

  return (
    <li className="rounded-xl border border-border bg-surface p-4 text-left shadow-sm transition-shadow hover:shadow-md sm:p-5">
      {note.book ? (
        <Link href={bookHref ?? "#"} className={readingNoteBookLink}>
          <div className="h-14 w-10 shrink-0 overflow-visible rounded shadow-sm">
            <BookCover
              title={note.book.title}
              coverUrl={note.book.cover_url}
              className="h-full w-full"
              sizes="40px"
              bookmarked
              bookmarkBadgeSize="small"
            />
          </div>
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-semibold text-puce-red">{note.book.title}</p>
            {note.book.author ? (
              <p className="mt-0.5 line-clamp-1 text-xs text-text-muted">{note.book.author}</p>
            ) : null}
          </div>
        </Link>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-text" suppressHydrationWarning>
            {formatNoteDate(note.created_at)}
          </p>
          {locationLabel ? (
            <p className="text-xs text-text-muted">{locationLabel}</p>
          ) : null}
        </div>
        <NoteTag
          label={categoryMeta.label}
          emoji={categoryMeta.emoji}
          category={note.category}
          isCustom={isCustomReadingNoteCategory(note.category)}
        />
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

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ShareNoteButton note={note} book={note.book} />
        {bookHref ? (
          <Link
            href={bookHref}
            className="inline-flex min-h-[44px] items-center font-medium text-primary hover:underline"
          >
            View on book page →
          </Link>
        ) : null}
      </div>
    </li>
  );
}
