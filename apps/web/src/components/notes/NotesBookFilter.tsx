"use client";

import { useMemo, useState } from "react";
import { BookCover } from "@/components/books/BookCover";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";
import {
  NOTES_BOOK_FILTER_COPY,
  NOTES_BOOK_SEARCH_THRESHOLD,
  filterNotesBookOptionsByQuery,
  formatNotesBookCount,
  notesBookFilterLabel,
  type NotesBookFilterOption,
} from "@bookmarked/utils/notesBookFilter";

type Props = {
  options: NotesBookFilterOption[];
  selectedUserBookId: string | null;
  onSelect: (userBookId: string | null) => void;
};

export function NotesBookFilter({ options, selectedUserBookId, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedLabel = notesBookFilterLabel(selectedUserBookId, options);
  const filtered = useMemo(
    () => filterNotesBookOptionsByQuery(options, query),
    [options, query]
  );
  const showSearch = options.length >= NOTES_BOOK_SEARCH_THRESHOLD;

  function choose(userBookId: string | null) {
    onSelect(userBookId);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="text-left">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-text-muted">
          {NOTES_BOOK_FILTER_COPY.label}
        </span>
        <button
          type="button"
          className={cn(
            "flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm text-text",
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
      </label>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setQuery("");
        }}
        title={NOTES_BOOK_FILTER_COPY.label}
      >
        {showSearch ? (
          <Input
            label={NOTES_BOOK_FILTER_COPY.searchLabel}
            hideLabel
            placeholder={NOTES_BOOK_FILTER_COPY.searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        ) : null}

        <ul className="space-y-2" role="listbox" aria-label={NOTES_BOOK_FILTER_COPY.label}>
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
        </ul>
        {filtered.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">No books match that search.</p>
        ) : null}
      </Modal>
    </div>
  );
}
