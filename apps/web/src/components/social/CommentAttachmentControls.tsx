"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { isGiphySearchConfigured, searchGiphy, type GiphySearchResult } from "@/lib/services/giphy";
import { uploadPostImage, validatePostImageFile } from "@/lib/services/posts";
import { isAllowedPostImageUrl, resolveGiphyImageUrl } from "@/lib/utils/giphy";

export function useCommentAttachment() {
  const toast = useToast();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [gifInput, setGifInput] = useState("");
  const [gifSearchQuery, setGifSearchQuery] = useState("");
  const [gifSearchResults, setGifSearchResults] = useState<GiphySearchResult[]>([]);
  const [gifSearchLoading, setGifSearchLoading] = useState(false);
  const gifSearchEnabled = isGiphySearchConfigured();

  function clearImage() {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  }

  function clearGif() {
    setGifUrl(null);
    setGifInput("");
    setGifSearchQuery("");
    setGifSearchResults([]);
  }

  function clearAttachment() {
    clearImage();
    clearGif();
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

  async function resolveAttachmentUrl(): Promise<{ url: string | null; error?: string }> {
    if (imageFile) {
      const uploadResult = await uploadPostImage(imageFile);
      if (uploadResult.error) return { url: null, error: uploadResult.error };
      return { url: uploadResult.url ?? null };
    }

    return { url: gifUrl };
  }

  const hasAttachment = Boolean(imageFile || gifUrl);

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

  return {
    inputId,
    fileInputRef,
    imagePreview,
    gifUrl,
    gifInput,
    setGifInput,
    gifSearchQuery,
    setGifSearchQuery,
    gifSearchResults,
    gifSearchLoading,
    gifSearchEnabled,
    hasAttachment,
    clearAttachment,
    handleFileChange,
    applyGifUrl,
    selectGif,
    resolveAttachmentUrl,
  };
}

type ControlsProps = ReturnType<typeof useCommentAttachment> & {
  disabled?: boolean;
};

export function CommentAttachmentControls({
  disabled,
  inputId,
  fileInputRef,
  imagePreview,
  gifUrl,
  gifInput,
  setGifInput,
  gifSearchQuery,
  setGifSearchQuery,
  gifSearchResults,
  gifSearchLoading,
  gifSearchEnabled,
  clearAttachment,
  handleFileChange,
  applyGifUrl,
  selectGif,
}: ControlsProps) {
  return (
    <div className="space-y-2">
      {imagePreview ? (
        <div className="relative inline-block w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreview}
            alt="Attachment preview"
            className="max-h-40 rounded-lg border border-border object-cover"
          />
          <button
            type="button"
            onClick={clearAttachment}
            className="absolute -right-2 -top-2 rounded-full bg-surface px-2 py-0.5 text-xs shadow-sm ring-1 ring-border"
            aria-label="Remove attachment"
          >
            Remove
          </button>
        </div>
      ) : null}

      {gifUrl && !imagePreview ? (
        <div className="relative inline-block w-fit max-w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={gifUrl}
            alt="GIF preview"
            className="max-h-40 rounded-lg border border-border object-contain bg-background"
          />
          <button
            type="button"
            onClick={clearAttachment}
            className="absolute -right-2 -top-2 rounded-full bg-surface px-2 py-0.5 text-xs shadow-sm ring-1 ring-border"
            aria-label="Remove GIF"
          >
            Remove
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={handleFileChange}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || Boolean(gifUrl)}
          aria-label="Attach image"
        >
          Attach image
        </Button>
      </div>

      <details className="rounded-lg border border-border bg-background/50 px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium text-text">Add a GIF (optional)</summary>
        <div className="mt-3 space-y-3">
          <Input
            label="Giphy URL"
            value={gifInput}
            onChange={(e) => setGifInput(e.target.value)}
            onBlur={() => applyGifUrl(gifInput)}
            placeholder="Paste a giphy.com link"
            className="mb-0"
            disabled={disabled}
          />
          {gifSearchEnabled ? (
            <div>
              <Input
                label="Search Giphy"
                value={gifSearchQuery}
                onChange={(e) => setGifSearchQuery(e.target.value)}
                placeholder="Search for a GIF"
                className="mb-0"
                disabled={disabled}
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
                        disabled={disabled}
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
    </div>
  );
}
