"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

type Props = {
  imageUrl?: string | null;
  fallbackLabel: string;
  onFileSelect: (file: File) => void | Promise<void>;
  onRemove?: () => void | Promise<void>;
  disabled?: boolean;
  size?: "md" | "lg";
  className?: string;
};

const SIZE_CLASSES = {
  md: "h-20 w-20 text-lg",
  lg: "h-28 w-28 text-2xl",
} as const;

const SIZE_PX = {
  md: 80,
  lg: 112,
} as const;

export function CircleAvatarUpload({
  imageUrl,
  fallbackLabel,
  onFileSelect,
  onRemove,
  disabled = false,
  size = "md",
  className,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreviewUrl(imageUrl ?? null);
  }, [imageUrl]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setBusy(true);

    try {
      await onFileSelect(file);
    } catch (err) {
      setPreviewUrl(imageUrl ?? null);
      setError(err instanceof Error ? err.message : "Could not upload image.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!onRemove) return;
    setError(null);
    setBusy(true);
    try {
      await onRemove();
      setPreviewUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove image.");
    } finally {
      setBusy(false);
    }
  }

  const label = fallbackLabel.trim() || "Group";

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || busy}
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange disabled:opacity-60"
        aria-label={previewUrl ? "Change avatar" : "Upload avatar"}
      >
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt=""
            width={SIZE_PX[size]}
            height={SIZE_PX[size]}
            className={cn("rounded-full object-cover", SIZE_CLASSES[size])}
            unoptimized
          />
        ) : (
          <div
            className={cn(
              "flex items-center justify-center rounded-full bg-royal-orange/20 font-bold text-puce-red",
              SIZE_CLASSES[size]
            )}
          >
            {label.slice(0, 2).toUpperCase()}
          </div>
        )}
      </button>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        disabled={disabled || busy}
        onChange={(event) => void handleFileChange(event)}
      />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={busy}
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {previewUrl ? "Change photo" : "Upload photo"}
        </Button>
        {previewUrl && onRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            loading={busy}
            disabled={disabled}
            onClick={() => void handleRemove()}
          >
            Remove
          </Button>
        ) : null}
      </div>

      <p className="max-w-xs text-center text-xs text-text-muted">
        JPEG, PNG, WebP, or GIF. Max 5 MB.
      </p>

      {error ? (
        <p className="text-center text-sm text-rust" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
