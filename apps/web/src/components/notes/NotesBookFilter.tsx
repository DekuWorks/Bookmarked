"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { BookCover } from "@/components/books/BookCover";
import { SearchBar } from "@/components/search/SearchBar";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";
import {
  NOTES_BOOK_FILTER_COPY,
  filterNotesBookOptionsByQuery,
  formatNotesBookCount,
  notesBookFilterLabel,
  type NotesBookFilterOption,
} from "@bookmarked/utils/notesBookFilter";

export const NOTES_TAB_HEADING_CLASS =
  "text-center text-base font-semibold text-puce-red";

type Props = {
  options: NotesBookFilterOption[];
  selectedUserBookId: string | null;
  onSelect: (userBookId: string | null) => void;
  headingClassName?: string;
};

export function NotesBookFilter({
  options,
  selectedUserBookId,
  onSelect,
  headingClassName = NOTES_TAB_HEADING_CLASS,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedLabel = notesBookFilterLabel(selectedUserBookId, options);
  const filtered = useMemo(
    () => filterNotesBookOptionsByQuery(options, query),
    [options, query]
  );

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  function choose(userBookId: string | null) {
    onSelect(userBookId);
    close();
  }

  return (
    <div className="flex w-full flex-col items-center">
      <h3 className={headingClassName}>{NOTES_BOOK_FILTER_COPY.label}</h3>
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          "mt-2 flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm text-text",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${NOTES_BOOK_FILTER_COPY.label}: ${selectedLabel}`}
        onClick={() => setOpen(true)}
      >
        <span className="min-w-0 truncate font-medium">{selectedLabel}</span>
        <span aria-hidden className="text-text-muted">
          ▾
        </span>
      </button>

      <Modal
        open={open}
        onClose={close}
        title={NOTES_BOOK_FILTER_COPY.label}
        scrollPanel={false}
      >
        <div className="sticky top-0 z-[1] shrink-0 bg-surface pb-3">
          <SearchBar
            label={NOTES_BOOK_FILTER_COPY.searchLabel}
            placeholder={NOTES_BOOK_FILTER_COPY.searchPlaceholder}
            value={query}
            onChange={setQuery}
            onClear={() => setQuery("")}
          />
        </div>

        <ul
          className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1"
          role="listbox"
          aria-label={NOTES_BOOK_FILTER_COPY.label}
          onWheel={(event) => event.stopPropagation()}
        >
          <li>
            <button
              type="button"
              role="option"
              aria-selected={selectedUserBookId == null}
              onClick={() => choose(null)}
              className={cn(
                "flex min-h-[44px] w-full items-center rounded-xl border px-3 py-2 text-left text-sm font-semibold transition",
                selectedUserBookId == null
                  ? "border-primary bg-primary/10 text-puce-red"
                  : "border-border bg-background text-text hover:border-primary/40"
              )}
            >
              {NOTES_BOOK_FILTER_COPY.allBooks}
            </button>
          </li>
          {filtered.map((option) => {
            const selected = option.userBookId === selectedUserBookId;
            return (
              <li key={option.userBookId}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => choose(option.userBookId)}
                  className={cn(
                    "flex min-h-[44px] w-full items-center gap-3 rounded-xl border p-2 text-left transition",
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/40"
                  )}
                >
                  <div className="h-14 w-10 shrink-0 overflow-hidden rounded">
                    <BookCover
                      title={option.title}
                      author={option.author ?? undefined}
                      coverUrl={option.coverUrl}
                      className="h-full w-full"
                      sizes="40px"
                      bookmarked
                      bookmarkBadgeSize="small"
                    />
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-text">
                      {option.title}
                    </span>
                    {option.author ? (
                      <span className="mt-0.5 block truncate text-xs text-text-muted">
                        {option.author}
                      </span>
                    ) : null}
                    <span className="mt-0.5 block text-xs text-text-muted">
                      {formatNotesBookCount(option.noteCount)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 ? (
            <li>
              <p className="py-3 text-sm text-text-muted">
                {NOTES_BOOK_FILTER_COPY.searchEmpty}
              </p>
            </li>
          ) : null}
        </ul>
      </Modal>
    </div>
  );
}
