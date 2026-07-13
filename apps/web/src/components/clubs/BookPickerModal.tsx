"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { BookCover } from "@/components/books/BookCover";
import { searchCatalogBooks, type BookSearchResult } from "@/lib/services/feedSearch";
import { cn } from "@/lib/utils/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  viewerId: string;
  title?: string;
  onSelect: (book: BookSearchResult) => void;
};

export function BookPickerModal({ open, onClose, viewerId, title = "Choose a book", onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setResults([]);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    const handle = window.setTimeout(() => {
      void searchCatalogBooks(trimmed, viewerId, 12)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 250);

    return () => window.clearTimeout(handle);
  }, [query, viewerId, open]);

  return (
    <Modal open={open} onClose={onClose} title={title} className="max-w-lg">
      <div className="space-y-4">
        <Input
          label="Search the catalog"
          name="club-book-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or author"
          className="mb-0"
        />

        {searching ? (
          <p className="text-sm text-text-muted">Searching…</p>
        ) : query.trim().length >= 2 && results.length === 0 ? (
          <p className="text-sm text-text-muted">No books found.</p>
        ) : (
          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {results.map((book) => (
              <li key={book.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(book);
                    onClose();
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2 text-left transition",
                    "hover:border-primary/40 hover:bg-primary/5"
                  )}
                >
                  <div className="h-16 w-11 shrink-0 overflow-hidden rounded-md">
                    <BookCover
                      title={book.title}
                      author={book.author}
                      coverUrl={book.cover_url}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text">{book.title}</p>
                    {book.author ? (
                      <p className="truncate text-xs text-text-muted">{book.author}</p>
                    ) : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
