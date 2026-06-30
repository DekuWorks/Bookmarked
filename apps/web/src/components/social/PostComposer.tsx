"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { getUserLibraryBooks, type LibraryBookRow } from "@/lib/services/library";
import { createPost, uploadPostImage, validatePostImageFile } from "@/lib/services/posts";

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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void getUserLibraryBooks(userId)
      .then((books) => setRecentBooks(books.slice(0, 6)))
      .catch(() => setRecentBooks([]));
  }, [userId]);

  function clearImage() {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
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

    clearImage();
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed && !imageFile) {
      toast.error("Write something or attach an image before posting.");
      return;
    }

    setSubmitting(true);

    let imageUrl: string | null = null;
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
    onPostCreated?.();
  }

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
            disabled={submitting}
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
          disabled={!body.trim() && !imageFile}
          onClick={() => void handleSubmit()}
        >
          Post
        </Button>
      </div>
    </section>
  );
}
