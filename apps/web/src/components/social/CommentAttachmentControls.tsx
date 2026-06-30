"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GifSearchPicker } from "@/components/social/GifSearchPicker";
import { useToast } from "@/components/ui/Toast";
import type { GiphySearchResult } from "@/lib/services/giphy";
import { uploadPostImage, validatePostImageFile } from "@/lib/services/posts";
import { isAllowedPostImageUrl, resolveGiphyImageUrl } from "@/lib/utils/giphy";

type AttachmentUploadResult = { url?: string; error?: string };

type UseCommentAttachmentOptions = {
  validateFile?: (file: File) => string | null;
  uploadImage?: (file: File) => Promise<AttachmentUploadResult>;
};

export function useCommentAttachment(options?: UseCommentAttachmentOptions) {
  const validateFile = options?.validateFile ?? validatePostImageFile;
  const uploadImage =
    options?.uploadImage ??
    (async (file: File) => uploadPostImage(file));
  const toast = useToast();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [gifInput, setGifInput] = useState("");

  function clearImage() {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  }

  function clearGif() {
    setGifUrl(null);
    setGifInput("");
  }

  function clearAttachment() {
    clearImage();
    clearGif();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateFile(file);
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
  }

  async function resolveAttachmentUrl(): Promise<{ url: string | null; error?: string }> {
    if (imageFile) {
      const uploadResult = await uploadImage(imageFile);
      if (uploadResult.error) return { url: null, error: uploadResult.error };
      return { url: uploadResult.url ?? null };
    }

    return { url: gifUrl };
  }

  const hasAttachment = Boolean(imageFile || gifUrl);

  return {
    inputId,
    fileInputRef,
    imagePreview,
    gifUrl,
    gifInput,
    setGifInput,
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
        <GifSearchPicker
          gifInput={gifInput}
          onGifInputChange={setGifInput}
          onGifInputBlur={() => applyGifUrl(gifInput)}
          onSelect={selectGif}
          hasGif={Boolean(gifUrl)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
