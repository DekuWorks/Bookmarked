"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { getUserLibraryBooks, type LibraryBookRow } from "@/lib/services/library";
import { createPost, uploadPostImage, validatePostImageFile } from "@/lib/services/posts";
import { isGiphySearchConfigured, searchGiphy, type GiphySearchResult } from "@/lib/services/giphy";
import { isAllowedPostImageUrl, resolveGiphyImageUrl } from "@/lib/utils/giphy";

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

export function PostComposer({ userId, onPostCreated }: Props) {
  const toast = useToast();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [bookInput, setBookInput] = useState("");
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [recentBooks, setRecentBooks] = useState<LibraryBookRow[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [gifInput, setGifInput] = useState("");
  const [gifSearchQuery, setGifSearchQuery] = useState("");
  const [gifSearchResults, setGifSearchResults] = useState<GiphySearchResult[]>([]);
  const [gifSearchLoading, setGifSearchLoading] = useState(false);
  const gifSearchEnabled = isGiphySearchConfigured();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void getUserLibraryBooks(userId)
      .then((books) => setRecentBooks(books.slice(0, 6)))
      .catch(() => setRecentBooks([]));
  }, [userId]);

  useEffect(() => {
    const query = gifSearchQuery.trim();
    if (!query || !gifSearchEnabled) {
      setGifSearchResults([]);
      setGifSearchLoading(false);
      return;
    }

    const handle = window.setTimeout(() => {
      setGifSearchLoading(true);
      void searchGiphy(query)
        .then(setGifSearchResults)
        .catch(() => setGifSearchResults([]))
        .finally(() => setGifSearchLoading(false));
    }, 350);

    return () => window.clearTimeout(handle);
  }, [gifSearchQuery, gifSearchEnabled]);

  function clearImage() {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
  }

  function clearGif() {
    setGifUrl(null);
    setGifInput("");
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
  }

  function applyGifUrl(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) {
      clearGif();
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
  }

  function selectGif(result: GiphySearchResult) {
    clearImage();
    setGifUrl(result.imageUrl);
    setGifInput(result.imageUrl);
    setGifSearchQuery("");
    setGifSearchResults([]);
  }

  async function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed && !imageFile && !gifUrl) {
      toast.error("Write something or attach an image or GIF before posting.");
      return;
    }

    setSubmitting(true);

    let imageUrl: string | null = gifUrl;
    if (imageFile) {
      const uploadResult = await uploadPostImage(imageFile);
      if (uploadResult.error) {
        setSubmitting(false);
        toast.error(uploadResult.error);
        return;
      }
      imageUrl = uploadResult.url ?? null;
    }

    const bookId = selectedBookId ?? extractBookId(bookInput);
    const result = await createPost({
      body: trimmed,
      bookId,
      imageUrl,
    });
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Post published.");
    setBody("");
    setBookInput("");
    setSelectedBookId(null);
    clearImage();
    clearGif();
    setGifSearchQuery("");
    setGifSearchResults([]);
    onPostCreated?.();
  }

  const hasAttachment = Boolean(imageFile || gifUrl);

  return (
    <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-puce-red">Create a post</h2>
      <Textarea
        label="What's on your mind?"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share a reading thought, recommendation, or update…"
        className="mb-3 min-h-[100px]"
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
            onClick={clearImage}
            className="absolute -right-2 -top-2 rounded-full bg-surface px-2 py-0.5 text-xs shadow-sm ring-1 ring-border"
            aria-label="Remove image"
          >
            Remove
          </button>
        </div>
      ) : null}

      {gifUrl ? (
        <div className="relative mb-3 inline-block w-fit max-w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={gifUrl}
            alt="Post GIF preview"
            className="max-h-48 rounded-lg border border-border object-contain bg-background"
          />
          <button
            type="button"
            onClick={clearGif}
            className="absolute -right-2 -top-2 rounded-full bg-surface px-2 py-0.5 text-xs shadow-sm ring-1 ring-border"
            aria-label="Remove GIF"
          >
            Remove
          </button>
        </div>
      ) : null}

      <details className="mb-3 rounded-lg border border-border bg-background/50 px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium text-text">Add a GIF (optional)</summary>
        <div className="mt-3 space-y-3">
          <Input
            label="Giphy URL"
            value={gifInput}
            onChange={(e) => setGifInput(e.target.value)}
            onBlur={() => applyGifUrl(gifInput)}
            placeholder="Paste a giphy.com link"
            className="mb-0"
          />
          {gifSearchEnabled ? (
            <div>
              <Input
                label="Search Giphy"
                value={gifSearchQuery}
                onChange={(e) => setGifSearchQuery(e.target.value)}
                placeholder="Search for a GIF"
                className="mb-0"
              />
              {gifSearchLoading ? (
                <p className="mt-2 text-xs text-text-muted">Searching…</p>
              ) : gifSearchResults.length > 0 ? (
                <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {gifSearchResults.map((result) => (
                    <li key={result.id}>
                      <button
                        type="button"
                        onClick={() => selectGif(result)}
                        className="block w-full overflow-hidden rounded-md border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
                        title={result.title}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={result.previewUrl}
                          alt={result.title}
                          className="aspect-square w-full object-cover"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </details>

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
                        }}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition min-h-[44px] ${
                          selected
                            ? "border-primary bg-primary/20 text-puce-red"
                            : "border-border text-text hover:border-primary/40"
                        }`}
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

      <div className="flex items-center justify-between gap-2">
        <div>
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
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          loading={submitting}
          disabled={!body.trim() && !hasAttachment}
          onClick={() => void handleSubmit()}
        >
          Post
        </Button>
      </div>
    </section>
  );
}
