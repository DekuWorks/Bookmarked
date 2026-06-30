"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MentionComposer } from "@/components/social/MentionComposer";
import { useToast } from "@/components/ui/Toast";
import { getUserLibraryBooks, type LibraryBookRow } from "@/lib/services/library";
import { createPost, uploadPostImage, validatePostImageFile } from "@/lib/services/posts";
import {
  clearComposerAutosave,
  deleteDraft,
  listDrafts,
  loadComposerAutosave,
  saveComposerAutosave,
  saveDraft,
} from "@/lib/services/postDrafts";
import type { PostDraft } from "@/types";
import { GifSearchPicker } from "@/components/social/GifSearchPicker";
import type { GiphySearchResult } from "@/lib/services/giphy";
import { isAllowedPostImageUrl, resolveGiphyImageUrl } from "@/lib/utils/giphy";
import { cn } from "@/lib/utils/cn";

type Props = {
  userId: string;
  onPostCreated?: () => void;
};

function extractBookId(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const uuidMatch = trimmed.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  );
  if (uuidMatch) return uuidMatch[0];

  try {
    const url = new URL(trimmed, "https://bookmarked.online");
    const id = url.searchParams.get("id");
    if (id) return id;
  } catch {
    // not a URL
  }

  return trimmed;
}

function draftPreview(draft: PostDraft): string {
  const text = draft.body.trim();
  if (text) return text.length > 60 ? `${text.slice(0, 60)}…` : text;
  if (draft.image_url) return "Image draft";
  if (draft.book_id) return "Book draft";
  return "Empty draft";
}

export function PostComposer({ userId, onPostCreated }: Props) {
  const toast = useToast();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [body, setBody] = useState("");
  const [bookInput, setBookInput] = useState("");
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [recentBooks, setRecentBooks] = useState<LibraryBookRow[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [remoteImageUrl, setRemoteImageUrl] = useState<string | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [gifInput, setGifInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<PostDraft[]>([]);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [draftsLoading, setDraftsLoading] = useState(false);

  const refreshDrafts = useCallback(async () => {
    try {
      const next = await listDrafts();
      setDrafts(next);
    } catch {
      setDrafts([]);
    }
  }, []);

  useEffect(() => {
    void getUserLibraryBooks(userId)
      .then((books) => setRecentBooks(books.slice(0, 6)))
      .catch(() => setRecentBooks([]));
  }, [userId]);

  useEffect(() => {
    void refreshDrafts();
  }, [refreshDrafts]);

  useEffect(() => {
    const saved = loadComposerAutosave(userId);
    if (!saved) return;

    setBody(saved.body);
    setBookInput(saved.bookInput);
    setSelectedBookId(saved.selectedBookId);
    setGifUrl(saved.gifUrl);
    setGifInput(saved.gifInput);
    setRemoteImageUrl(saved.remoteImageUrl);
    setActiveDraftId(saved.activeDraftId);
  }, [userId]);

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, []);

  function persistAutosave() {
    saveComposerAutosave(userId, {
      body,
      bookInput,
      selectedBookId,
      gifUrl,
      gifInput,
      remoteImageUrl,
      activeDraftId,
    });
  }

  function scheduleAutosave() {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      persistAutosave();
    }, 800);
  }

  function clearImage() {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setRemoteImageUrl(null);
  }

  function clearGif() {
    setGifUrl(null);
    setGifInput("");
  }

  function resetComposer() {
    setBody("");
    setBookInput("");
    setSelectedBookId(null);
    clearImage();
    clearGif();
    setActiveDraftId(null);
    clearComposerAutosave(userId);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validatePostImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    clearGif();
    clearImage();
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    scheduleAutosave();
  }

  function applyGifUrl(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) {
      clearGif();
      scheduleAutosave();
      return;
    }

    if (!isAllowedPostImageUrl(trimmed)) {
      toast.error("Paste a valid Giphy link (giphy.com or media.giphy.com).");
      return;
    }

    const resolved = resolveGiphyImageUrl(trimmed);
    if (!resolved) {
      toast.error("Could not read that Giphy link.");
      return;
    }

    clearImage();
    setGifUrl(resolved);
    setGifInput(trimmed);
    scheduleAutosave();
  }

  function selectGif(result: GiphySearchResult) {
    clearImage();
    setGifUrl(result.imageUrl);
    setGifInput(result.imageUrl);
    scheduleAutosave();
  }

  async function resolveImageUrl(): Promise<{ url: string | null; error?: string }> {
    if (imageFile) {
      const uploadResult = await uploadPostImage(imageFile);
      if (uploadResult.error) return { url: null, error: uploadResult.error };
      return { url: uploadResult.url ?? null };
    }

    return { url: gifUrl ?? remoteImageUrl };
  }

  async function handleSaveDraft() {
    const trimmed = body.trim();
    const bookId = selectedBookId ?? extractBookId(bookInput);

    setSavingDraft(true);
    const imageResult = await resolveImageUrl();
    if (imageResult.error) {
      setSavingDraft(false);
      toast.error(imageResult.error);
      return;
    }

    const imageUrl = imageResult.url;
    if (!trimmed && !imageUrl && !bookId) {
      setSavingDraft(false);
      toast.error("Add something before saving a draft.");
      return;
    }

    const result = await saveDraft({
      id: activeDraftId,
      body: trimmed,
      bookId,
      imageUrl,
    });
    setSavingDraft(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.draft) {
      setActiveDraftId(result.draft.id);
      if (result.draft.image_url) {
        setRemoteImageUrl(result.draft.image_url);
        clearImage();
        if (!gifUrl) setGifUrl(result.draft.image_url);
      }
    }

    clearComposerAutosave(userId);
    toast.success("Draft saved.");
    void refreshDrafts();
  }

  async function handleLoadDraft(draft: PostDraft) {
    setActiveDraftId(draft.id);
    setBody(draft.body);
    setBookInput(draft.book_id ?? "");
    setSelectedBookId(draft.book_id);
    clearImage();
    clearGif();

    if (draft.image_url) {
      setRemoteImageUrl(draft.image_url);
      if (isAllowedPostImageUrl(draft.image_url)) {
        setGifUrl(draft.image_url);
        setGifInput(draft.image_url);
      } else {
        setImagePreview(draft.image_url);
      }
    } else {
      setRemoteImageUrl(null);
    }

    setDraftsOpen(false);
    clearComposerAutosave(userId);
    toast.success("Draft loaded.");
  }

  async function handleDeleteDraft(draftId: string) {
    const result = await deleteDraft(draftId);
    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (activeDraftId === draftId) {
      resetComposer();
    }

    toast.success("Draft deleted.");
    void refreshDrafts();
  }

  async function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed && !imageFile && !gifUrl && !remoteImageUrl) {
      toast.error("Write something or attach an image or GIF before posting.");
      return;
    }

    setSubmitting(true);

    const imageResult = await resolveImageUrl();
    if (imageResult.error) {
      setSubmitting(false);
      toast.error(imageResult.error);
      return;
    }

    const bookId = selectedBookId ?? extractBookId(bookInput);
    const result = await createPost({
      body: trimmed,
      bookId,
      imageUrl: imageResult.url,
    });
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (activeDraftId) {
      await deleteDraft(activeDraftId);
      void refreshDrafts();
    }

    toast.success("Post published.");
    resetComposer();
    onPostCreated?.();
  }

  const hasAttachment = Boolean(imageFile || gifUrl || remoteImageUrl);
  const canSubmit = Boolean(body.trim() || hasAttachment);

  return (
    <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-puce-red">Create a post</h2>

        <div className="relative">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setDraftsOpen((open) => !open);
              if (!draftsOpen && !drafts.length) {
                setDraftsLoading(true);
                void refreshDrafts().finally(() => setDraftsLoading(false));
              }
            }}
          >
            Drafts{drafts.length > 0 ? ` (${drafts.length})` : ""}
          </Button>

          {draftsOpen ? (
            <div className="absolute right-0 z-20 mt-1 w-72 rounded-lg border border-border bg-surface py-1 shadow-md">
              {draftsLoading ? (
                <p className="px-3 py-2 text-sm text-text-muted">Loading drafts…</p>
              ) : drafts.length === 0 ? (
                <p className="px-3 py-2 text-sm text-text-muted">No saved drafts yet.</p>
              ) : (
                <ul>
                  {drafts.map((draft) => (
                    <li key={draft.id} className="flex items-start gap-1 px-1">
                      <button
                        type="button"
                        className="min-w-0 flex-1 rounded-md px-2 py-2 text-left text-sm hover:bg-background"
                        onClick={() => void handleLoadDraft(draft)}
                      >
                        <span className="block truncate text-text">{draftPreview(draft)}</span>
                        <span className="text-xs text-text-muted">
                          {new Date(draft.updated_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="shrink-0 rounded-md px-2 py-2 text-xs text-text-muted hover:bg-background hover:text-red-600"
                        aria-label="Delete draft"
                        onClick={() => void handleDeleteDraft(draft.id)}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <MentionComposer
        viewerId={userId}
        value={body}
        onChange={(value) => {
          setBody(value);
          scheduleAutosave();
        }}
        placeholder="Share a reading thought, recommendation, or update… Use @ to mention someone."
        minHeightClassName="min-h-[100px]"
        className="mb-3"
      />

      {imagePreview ? (
        <div className="relative mb-3 inline-block w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreview}
            alt="Post image preview"
            className="max-h-48 rounded-lg border border-border object-cover"
          />
          <button
            type="button"
            onClick={() => {
              clearImage();
              scheduleAutosave();
            }}
            className="absolute -right-2 -top-2 rounded-full bg-surface px-2 py-0.5 text-xs shadow-sm ring-1 ring-border"
            aria-label="Remove image"
          >
            Remove
          </button>
        </div>
      ) : null}

      {gifUrl && !imagePreview ? (
        <div className="relative mb-3 inline-block w-fit max-w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={gifUrl}
            alt="Post GIF preview"
            className="max-h-48 rounded-lg border border-border object-contain bg-background"
          />
          <button
            type="button"
            onClick={() => {
              clearGif();
              scheduleAutosave();
            }}
            className="absolute -right-2 -top-2 rounded-full bg-surface px-2 py-0.5 text-xs shadow-sm ring-1 ring-border"
            aria-label="Remove GIF"
          >
            Remove
          </button>
        </div>
      ) : null}

      <div className="mb-3 rounded-lg border border-border bg-background/50 px-3 py-3">
        <p className="mb-3 text-sm font-medium text-text">Add a GIF (optional)</p>
        <GifSearchPicker
          gifInput={gifInput}
          onGifInputChange={setGifInput}
          onGifInputBlur={() => applyGifUrl(gifInput)}
          onSelect={selectGif}
          disabled={submitting}
        />
      </div>

      <details className="mb-3 rounded-lg border border-border bg-background/50 px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium text-text">
          Attach a book (optional)
        </summary>
        <div className="mt-3 space-y-3">
          <Input
            label="Book ID or link"
            value={bookInput}
            onChange={(e) => {
              setBookInput(e.target.value);
              setSelectedBookId(null);
              scheduleAutosave();
            }}
            placeholder="Paste a book ID or /book/?id=… link"
            className="mb-0"
          />
          {recentBooks.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-medium text-text-muted">From your library</p>
              <ul className="flex flex-wrap gap-2">
                {recentBooks.map((row) => {
                  const book = row.books;
                  if (!book) return null;
                  const selected = selectedBookId === book.id;
                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBookId(selected ? null : book.id);
                          setBookInput(selected ? "" : book.id);
                          scheduleAutosave();
                        }}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition min-h-[44px]",
                          selected
                            ? "border-primary bg-primary/20 text-puce-red"
                            : "border-border text-text hover:border-primary/40"
                        )}
                      >
                        {book.title}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      </details>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={handleFileChange}
            disabled={submitting}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={submitting || Boolean(gifUrl)}
            aria-label="Attach image"
          >
            Attach image
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            loading={savingDraft}
            disabled={submitting}
            onClick={() => void handleSaveDraft()}
          >
            Save draft
          </Button>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          loading={submitting}
          disabled={!canSubmit || savingDraft}
          onClick={() => void handleSubmit()}
        >
          Post
        </Button>
      </div>
    </section>
  );
}
