"use client";

import { useEffect, useRef } from "react";
import { BookCover } from "@/components/books/BookCover";
import { Button } from "@/components/ui/Button";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import type { LibraryBookRow } from "@/lib/services/library";
import type { SuggestedShelf } from "@/lib/services/suggestedShelves";
import { cn } from "@/lib/utils/cn";

type Props = {
  open: boolean;
  shelf: SuggestedShelf | null;
  matchingBooks: LibraryBookRow[];
  creating?: boolean;
  onClose: () => void;
  onCreate: () => void;
  onCustomize: () => void;
};

function shelfSubtitle(shelf: SuggestedShelf): string {
  const parts: string[] = [];
  if (shelf.genre) parts.push(shelf.genre);
  else parts.push(shelf.reason);
  return parts.join(" · ");
}

export function SuggestedShelfPreviewBar({
  open,
  shelf,
  matchingBooks,
  creating = false,
  onClose,
  onCreate,
  onCustomize,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !shelf) return null;

  const previewBooks = matchingBooks.slice(0, 8);
  const overflow = matchingBooks.length - previewBooks.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-end sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-puce-red/40"
        aria-label="Close preview"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shelf-preview-title"
        className={cn(
          "relative z-10 w-full border border-border bg-surface shadow-xl",
          "rounded-t-2xl sm:max-w-lg sm:rounded-xl",
          "mx-0 max-h-[85vh] overflow-y-auto sm:mx-4"
        )}
      >
        <div className="border-b border-border px-4 py-3 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2
                id="shelf-preview-title"
                className="truncate text-lg font-semibold text-puce-red"
              >
                📚 {shelf.name}
              </h2>
              <p className="mt-0.5 text-sm text-text-muted">{shelfSubtitle(shelf)}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
              aria-label="Close preview"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-5">
          {matchingBooks.length > 0 ? (
            <>
              <p className="mb-3 text-sm text-text-muted">
                {matchingBooks.length} book{matchingBooks.length === 1 ? "" : "s"} from your
                library
              </p>
              <ul className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {previewBooks.map((row) => {
                  const book = row.books;
                  return (
                    <li key={row.id} className="w-14 shrink-0 sm:w-16">
                      <BookCover
                        title={book?.title ?? "Untitled"}
                        author={book?.author}
                        coverUrl={book?.cover_url}
                        className="w-full"
                        sizes="64px"
                      />
                    </li>
                  );
                })}
                {overflow > 0 ? (
                  <li className="flex w-14 shrink-0 items-center justify-center sm:w-16">
                    <span className="rounded-lg border border-dashed border-border bg-background px-2 py-4 text-xs font-medium text-text-muted">
                      +{overflow}
                    </span>
                  </li>
                ) : null}
              </ul>
            </>
          ) : (
            <p className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-text-muted">
              No matching books in your library yet — you can still create this shelf and add
              books later.
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border px-4 py-3 sm:px-5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={creating}
            onClick={onClose}
            className="min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={creating}
            onClick={onCustomize}
            className="min-h-[44px]"
          >
            Customize
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={creating}
            onClick={onCreate}
            className="min-h-[44px]"
          >
            Create shelf
          </Button>
        </div>
      </div>
    </div>
  );
}
