"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { updateBookFormat } from "@/lib/actions/book";
import { cn } from "@/lib/utils/cn";

type Props = {
  bookId: string;
  format?: "book" | "ebook" | "audiobook";
  onFormatChange?: () => void;
};

const OPTIONS: { value: "book" | "audiobook"; label: string; icon: string }[] = [
  { value: "book", label: "Book", icon: "📖" },
  { value: "audiobook", label: "Audiobook", icon: "🎧" },
];

/**
 * Lets a reader mark a catalog book as an audiobook (or switch it back).
 * This is the entry point for audiobook tracking — `ReadingProgressPanel`
 * only shows listening-time fields once `books.format` is "audiobook".
 */
export function BookFormatToggle({ bookId, format = "book", onFormatChange }: Props) {
  const toast = useToast();
  const [optimisticFormat, setOptimisticFormat] = useState(format);
  const [pending, setPending] = useState(false);
  const isAudiobook = optimisticFormat === "audiobook";

  async function selectFormat(next: "book" | "audiobook") {
    if (next === optimisticFormat || pending) return;
    const previous = optimisticFormat;
    setOptimisticFormat(next);
    setPending(true);

    const formData = new FormData();
    formData.set("book_id", bookId);
    formData.set("format", next);

    try {
      const result = await updateBookFormat({}, formData);
      if (result.error) {
        setOptimisticFormat(previous);
        toast.error(result.error);
        return;
      }
      if (result.success) toast.success(result.success);
      onFormatChange?.();
    } catch (error) {
      setOptimisticFormat(previous);
      toast.error(error instanceof Error ? error.message : "Could not update format.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
        Track as
      </span>
      <div
        role="group"
        aria-label="Book format"
        className="inline-flex rounded-full border border-border bg-surface p-1"
      >
        {OPTIONS.map((option) => {
          const active = isAudiobook ? option.value === "audiobook" : option.value === "book";
          return (
            <button
              key={option.value}
              type="button"
              disabled={pending}
              aria-pressed={active}
              onClick={() => void selectFormat(option.value)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors disabled:opacity-60",
                active
                  ? "bg-primary text-on-primary"
                  : "text-text-muted hover:bg-primary/10 hover:text-text"
              )}
            >
              <span className="mr-1.5">{option.icon}</span>
              {option.label}
            </button>
          );
        })}
      </div>
      {isAudiobook ? (
        <p className="max-w-xs text-center text-xs text-text-muted">
          Progress below now tracks listening time instead of pages.
        </p>
      ) : null}
    </div>
  );
}
