"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { BookCover } from "@/components/books/BookCover";
import { ShelfSelectMenu } from "@/components/shelves/ShelfSelectMenu";
import { useToast } from "@/components/ui/Toast";
import {
  addOpenLibraryBookToShelf,
  ensureOpenLibraryBook,
} from "@/lib/services/books";
import { resolveBookCoverUrl } from "@/lib/services/covers";
import { bookDetailsPath } from "@/lib/routes/book";
import { cn } from "@/lib/utils/cn";
import type { ShelfStatus } from "@/types";

type Props = {
  title: string;
  author: string | null;
  external_id: string;
  coverUrl: string | null;
  cover_i: string;
  page_count: string;
  isbn?: string;
  first_publish_year?: string;
  first_sentence?: string;
};

function ResultActions({
  onViewDetails,
  onAddToShelf,
  viewDetailsLoading,
  addLoading,
  className,
}: {
  onViewDetails: () => void;
  onAddToShelf: () => void;
  viewDetailsLoading: boolean;
  addLoading: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        loading={viewDetailsLoading}
        onClick={onViewDetails}
      >
        View details
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        loading={addLoading}
        disabled={addLoading}
        onClick={onAddToShelf}
        className="border-white bg-white/90 text-puce-red hover:bg-white md:border-primary md:bg-transparent md:text-white md:hover:bg-white/20"
      >
        Add to shelf
      </Button>
    </div>
  );
}

export function SearchResultCard({
  title,
  author,
  external_id,
  coverUrl,
  cover_i,
  page_count,
  isbn = "",
  first_publish_year = "",
  first_sentence = "",
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewDetailsLoading, setViewDetailsLoading] = useState(false);
  const [resolvedCoverUrl, setResolvedCoverUrl] = useState<string | null>(coverUrl);

  useEffect(() => {
    setResolvedCoverUrl(coverUrl);
  }, [coverUrl]);

  useEffect(() => {
    if (resolvedCoverUrl) return;

    let cancelled = false;
    void resolveBookCoverUrl({
      coverUrl,
      isbn,
      title,
      author,
    }).then((url) => {
      if (!cancelled && url) setResolvedCoverUrl(url);
    });

    return () => {
      cancelled = true;
    };
  }, [coverUrl, isbn, title, author, resolvedCoverUrl]);

  const bookPayload = {
    title,
    author,
    external_id,
    cover_i,
    page_count,
    isbn,
    first_publish_year,
    first_sentence,
  };

  async function handleViewDetails() {
    setViewDetailsLoading(true);
    try {
      const result = await ensureOpenLibraryBook(bookPayload);
      if (result.error || !result.bookId) {
        toast.error(result.error ?? "Could not open book details.");
        return;
      }
      router.push(bookDetailsPath(result.bookId));
    } finally {
      setViewDetailsLoading(false);
    }
  }

  function openShelfMenu() {
    setMenuOpen(true);
  }

  async function handleSelectShelf(shelfStatus: ShelfStatus) {
    setSaving(true);
    const formData = new FormData();
    formData.set("title", title);
    formData.set("author", author ?? "");
    formData.set("external_id", external_id);
    formData.set("cover_i", cover_i);
    formData.set("page_count", page_count);
    formData.set("isbn", isbn);
    formData.set("first_publish_year", first_publish_year);
    formData.set("first_sentence", first_sentence);
    formData.set("shelf_status", shelfStatus);

    try {
      const result = await addOpenLibraryBookToShelf({}, formData);
      if (result.error) {
        toast.error(result.error || "Could not add book. Please try again.");
        return;
      }
      if (result.success) {
        toast.success(result.success);
        setMenuOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <article
        tabIndex={0}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-primary/40 focus:outline-none"
      >
        <div className="relative aspect-[2/3] w-full">
          <BookCover
            title={title}
            author={author}
            coverUrl={resolvedCoverUrl}
            className="rounded-none border-0"
            sizes="(max-width: 768px) 50vw, 200px"
          />

          <div
            className="absolute inset-0 hidden flex-col items-stretch justify-end bg-puce-red/75 p-4 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 md:flex"
            aria-hidden={false}
          >
            <ResultActions
              onViewDetails={handleViewDetails}
              onAddToShelf={openShelfMenu}
              viewDetailsLoading={viewDetailsLoading}
              addLoading={saving}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4 text-center">
          <h3 className="line-clamp-2 font-semibold text-text">{title}</h3>
          {author ? (
            <p className="line-clamp-1 text-sm text-text-muted">{author}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 border-t border-border px-4 pb-4 pt-3 md:hidden">
          <ResultActions
            onViewDetails={handleViewDetails}
            onAddToShelf={openShelfMenu}
            viewDetailsLoading={viewDetailsLoading}
            addLoading={saving}
          />
        </div>
      </article>

      <ShelfSelectMenu
        bookTitle={title}
        open={menuOpen}
        loading={saving}
        onSelectShelf={handleSelectShelf}
        onClose={() => {
          if (!saving) setMenuOpen(false);
        }}
      />
    </>
  );
}
