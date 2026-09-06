"use client";

import { useState } from "react";
import { BookCover } from "@/components/books/BookCover";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { createPost } from "@/lib/services/posts";
import { Z_CLASS } from "@/lib/constants/zIndex";
import { cn } from "@/lib/utils/cn";
import type { FeedSourceType } from "@bookmarked/utils/feedShare";

export type ShareToFeedPreview = {
  sourceType: FeedSourceType;
  sourceId: string;
  bookId?: string | null;
  bookTitle?: string | null;
  bookCoverUrl?: string | null;
  rating?: number | null;
  body: string;
};

type Props = {
  open: boolean;
  preview: ShareToFeedPreview | null;
  onClose: () => void;
  onShared?: () => void;
};

export function ShareToFeedModal({ open, preview, onClose, onShared }: Props) {
  const toast = useToast();
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open || !preview) return null;

  async function share() {
    if (!preview) return;
    setSaving(true);
    const captionText = caption.trim();
    const result = await createPost({
      body: captionText ? `${captionText}\n\n${preview.body}` : preview.body,
      bookId: preview.bookId,
      sourceType: preview.sourceType,
      sourceId: preview.sourceId,
    });
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Shared to your feed.");
    setCaption("");
    onShared?.();
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Share to Feed"
      className={cn("fixed inset-0 flex items-center justify-center bg-background/70 p-4", Z_CLASS.sheet)}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-puce-red">Share to Feed</h2>
        <div className="flex gap-3 rounded-xl border border-border bg-background p-3">
          {preview.bookTitle ? (
            <div className="h-20 w-14 shrink-0">
              <BookCover
                title={preview.bookTitle}
                coverUrl={preview.bookCoverUrl}
                className="h-full w-full"
                sizes="56px"
              />
            </div>
          ) : null}
          <div className="min-w-0">
            {preview.bookTitle ? (
              <p className="font-semibold text-text">{preview.bookTitle}</p>
            ) : null}
            {preview.rating != null ? (
              <p className="text-sm text-text-muted">{preview.rating}/5</p>
            ) : null}
            <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm text-text-muted">{preview.body}</p>
          </div>
        </div>
        <Textarea
          label="Caption (optional)"
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          placeholder="Add a note for your feed…"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="primary" loading={saving} onClick={() => void share()}>
            Share to Feed
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
}
