"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MentionComposer } from "@/components/social/MentionComposer";
import { RepostPreview } from "@/components/social/RepostPreview";
import { useToast } from "@/components/ui/Toast";
import {
  updatePost,
  uploadPostImage,
  validatePostImageFile,
} from "@/lib/services/posts";
import { isAllowedPostImageUrl, isGiphyImageUrl, resolveGiphyImageUrl } from "@/lib/utils/giphy";
import type { PostWithAuthor } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  post: PostWithAuthor;
  viewerId: string;
  onSaved: (post: PostWithAuthor) => void;
  onCancel: () => void;
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

export function PostEditPanel({ post, viewerId, onSaved, onCancel }: Props) {
  const toast = useToast();
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRepost = Boolean(post.repost_of_post_id);

  const [body, setBody] = useState(post.body);
  const [bookInput, setBookInput] = useState(post.book_id ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [remoteImageUrl, setRemoteImageUrl] = useState<string | null>(post.image_url);
  const [gifUrl, setGifUrl] = useState<string | null>(
    post.image_url && isGiphyImageUrl(post.image_url) ? post.image_url : null
  );
  const [gifInput, setGifInput] = useState(
    post.image_url && isGiphyImageUrl(post.image_url) ? post.image_url : ""
  );
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);

  function clearImage() {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setRemoteImageUrl(null);
    setRemoveImage(true);
  }

  function clearGif() {
    setGifUrl(null);
    setGifInput("");
    setRemoveImage(true);
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
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoteImageUrl(null);
    setRemoveImage(false);
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

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setGifUrl(resolved);
    setGifInput(trimmed);
    setRemoteImageUrl(resolved);
    setRemoveImage(false);
  }

  async function resolveImageUrl(): Promise<{ url: string | null; error?: string }> {
    if (removeImage && !imageFile && !gifUrl) {
      return { url: null };
    }

    if (imageFile) {
      const uploadResult = await uploadPostImage(imageFile);
      if (uploadResult.error) return { url: null, error: uploadResult.error };
      return { url: uploadResult.url ?? null };
    }

    if (gifUrl) return { url: gifUrl };

    if (!removeImage && remoteImageUrl) return { url: remoteImageUrl };

    return { url: null };
  }

  async function handleSave() {
    const trimmed = body.trim();

    if (isRepost) {
      setSaving(true);
      const result = await updatePost(post.id, { body: trimmed });
      setSaving(false);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.post) {
        toast.success("Post updated.");
        onSaved(result.post);
      }
      return;
    }

    setSaving(true);
    const imageResult = await resolveImageUrl();
    if (imageResult.error) {
      setSaving(false);
      toast.error(imageResult.error);
      return;
    }

    const imageUrl = imageResult.url;
    if (!trimmed && !imageUrl) {
      setSaving(false);
      toast.error("Post cannot be empty.");
      return;
    }

    const bookId = extractBookId(bookInput);
    const result = await updatePost(post.id, {
      body: trimmed,
      image_url: imageUrl,
      book_id: bookId,
    });
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.post) {
      toast.success("Post updated.");
      onSaved(result.post);
    }
  }

  const displayImage =
    imagePreview ?? (gifUrl && !removeImage ? gifUrl : null) ??
    (!removeImage && remoteImageUrl && !gifUrl ? remoteImageUrl : null);

  return (
    <div className="mt-2 space-y-3 rounded-lg border border-border bg-background/60 p-3">
      <MentionComposer
        viewerId={viewerId}
        value={body}
        onChange={setBody}
        placeholder={
          isRepost
            ? "Edit your quote… Use @ to mention someone."
            : "Edit your post… Use @ to mention someone."
        }
        minHeightClassName="min-h-[80px]"
      />

      {!isRepost ? (
        <>
          {displayImage ? (
            <div className="relative inline-block w-fit max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImage}
                alt={gifUrl ? "Post GIF" : "Post image"}
                className={cn(
                  "max-h-48 rounded-lg border border-border",
                  gifUrl ? "object-contain bg-background" : "object-cover"
                )}
              />
              <button
                type="button"
                onClick={() => {
                  if (gifUrl) clearGif();
                  else clearImage();
                }}
                className="absolute -right-2 -top-2 rounded-full bg-surface px-2 py-0.5 text-xs shadow-sm ring-1 ring-border"
                aria-label="Remove image"
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
              disabled={saving}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving || Boolean(gifUrl)}
            >
              Attach image
            </Button>
          </div>

          <details className="rounded-lg border border-border bg-background/50 px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium text-text">Add a GIF (optional)</summary>
            <div className="mt-3">
              <Input
                label="Giphy URL"
                value={gifInput}
                onChange={(e) => setGifInput(e.target.value)}
                onBlur={() => applyGifUrl(gifInput)}
                placeholder="Paste a giphy.com link"
                className="mb-0"
              />
            </div>
          </details>

          <Input
            label="Book ID or link (optional)"
            value={bookInput}
            onChange={(e) => setBookInput(e.target.value)}
            placeholder="Paste a book ID or /book/?id=… link"
            className="mb-0"
          />
        </>
      ) : post.repost_of ? (
        <div>
          <p className="mb-2 text-xs font-medium text-text-muted">Reposted content (read-only)</p>
          <RepostPreview post={post.repost_of} />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="primary" size="sm" loading={saving} onClick={() => void handleSave()}>
          Save
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
