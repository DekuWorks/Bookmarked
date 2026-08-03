"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { BookCover } from "@/components/books/BookCover";
import { BookPickerModal } from "@/components/clubs/BookPickerModal";
import { useToast } from "@/components/ui/Toast";
import { createDiscussion } from "@/lib/services/bookClubs";
import type { BookSearchResult } from "@/lib/services/feedSearch";

type Props = {
  clubId: string;
  viewerId: string;
  onPosted?: () => void;
};

export function ClubDiscussionComposer({ clubId, viewerId, onPosted }: Props) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const [book, setBook] = useState<BookSearchResult | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle) {
      toast.error("Add a discussion title.");
      return;
    }
    if (!trimmedBody) {
      toast.error("Write something to start a discussion.");
      return;
    }

    setSubmitting(true);
    const result = await createDiscussion(clubId, {
      title: trimmedTitle,
      body: trimmedBody,
      bookId: book?.id ?? null,
      containsSpoilers,
    });
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setTitle("");
    setBody("");
    setContainsSpoilers(false);
    setBook(null);
    toast.success("Discussion posted.");
    onPosted?.();
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-4 text-left shadow-sm">
      <h2 className="mb-3 text-left text-sm font-semibold text-puce-red">Start a discussion</h2>

      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What do you want to talk about?"
        maxLength={120}
      />

      <Textarea
        name="club-discussion-body"
        label="Body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share a thought, question, or reaction with the club…"
        className="min-h-[90px]"
      />

      <label className="mb-3 flex items-center gap-2 text-sm text-text">
        <input
          type="checkbox"
          checked={containsSpoilers}
          onChange={(e) => setContainsSpoilers(e.target.checked)}
          className="rounded border-border"
        />
        Contains spoilers
      </label>

      {book ? (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-border p-3">
          <div className="h-16 w-11 shrink-0 overflow-hidden rounded-md">
            <BookCover
              title={book.title}
              author={book.author}
              coverUrl={book.cover_url}
              className="h-full w-full"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-text">{book.title}</p>
            {book.author ? <p className="truncate text-xs text-text-muted">{book.author}</p> : null}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setBook(null)}>
            Remove
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setPickerOpen(true)}>
          {book ? "Change book" : "Attach a book"}
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          loading={submitting}
          disabled={!title.trim() || !body.trim()}
          onClick={() => void handleSubmit()}
        >
          Post discussion
        </Button>
      </div>

      <BookPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        viewerId={viewerId}
        title="Attach a book"
        onSelect={setBook}
      />
    </section>
  );
}
