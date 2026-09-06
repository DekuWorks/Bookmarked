import { useState } from "react";
import { Pressable, Text } from "react-native";
import { ShareToFeedSheet, type ShareToFeedPreview } from "./ShareToFeedSheet";
import { buildNoteSharePostBody, noteIsShareableToFeed } from "../../../../packages/utils/feedShare";
import { formatNoteLocation } from "../../../../packages/utils/noteLocation";
import type { ReadingNote } from "../types";

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
      <Pressable onPress={() => setOpen(true)} className="active:opacity-70">
        <Text className="text-xs font-medium text-puce-red">Share to Feed</Text>
      </Pressable>
      <ShareToFeedSheet visible={open} preview={preview} onClose={() => setOpen(false)} />
    </>
  );
}
