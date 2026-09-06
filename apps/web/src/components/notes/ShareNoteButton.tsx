"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ShareToFeedModal, type ShareToFeedPreview } from "@/components/social/ShareToFeedModal";
import { buildNoteSharePostBody, noteIsShareableToFeed } from "@bookmarked/utils/feedShare";
import { formatNoteLocation } from "@bookmarked/utils/noteLocation";
import type { ReadingNote } from "@/types";

type Props = {
  note: ReadingNote;
  book?: { id: string; title: string; cover_url?: string | null } | null;
};

export function ShareNoteButton({ note, book }: Props) {
  const [open, setOpen] = useState(false);
  if (!noteIsShareableToFeed(note.visibility)) return null;

  const preview: ShareToFeedPreview = {
    sourceType: "note",
    sourceId: note.id,
    bookId: book?.id,
    bookTitle: book?.title,
    bookCoverUrl: book?.cover_url,
    body: buildNoteSharePostBody({
      quote: note.quote,
      note: note.note,
      bookTitle: book?.title,
      location: formatNoteLocation({
        pageNumber: note.page_number,
        chapterNumber: note.chapter,
      }),
    }),
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Share to Feed
      </Button>
      <ShareToFeedModal open={open} preview={preview} onClose={() => setOpen(false)} />
    </>
  );
}
