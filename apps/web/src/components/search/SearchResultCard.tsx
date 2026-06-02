"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { ShelfSelectMenu } from "@/components/shelves/ShelfSelectMenu";
import { useToast } from "@/components/ui/Toast";
import {
  addOpenLibraryBookToShelf,
  ensureOpenLibraryBook,
} from "@/lib/services/books";
import { cn } from "@/lib/utils/cn";
import type { ShelfStatus } from "@/types";

type Props = {
  title: string;
  author: string | null;
  external_id: string;
  coverUrl: string | null;
  cover_i: string;
  page_count: string;
};

function ResultActions({
  onViewDetails,
  onAddToShelf,
  viewDetailsLoading,
  addDisabled,
  className,
}: {
  onViewDetails: () => void;
  onAddToShelf: () => void;
  viewDetailsLoading: boolean;
  addDisabled: boolean;
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
        disabled={addDisabled}
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
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewDetailsLoading, setViewDetailsLoading] = useState(false);

  const bookPayload = { title, author, external_id, cover_i, page_count };

  async function handleViewDetails() {
    setViewDetailsLoading(true);
    try {
      const result = await ensureOpenLibraryBook(bookPayload);
      if (result.error || !result.bookId) {
        toast.error(result.error ?? "Could not open book details.");
        return;
      }
      router.push(`/books/${result.bookId}`);
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
    formData.set("shelf_status", shelfStatus);

    try {
      const result = await addOpenLibraryBookToShelf({}, formData);
      if (result.error) {
        toast.error(result.error);
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
        <div className="relative aspect-[2/3] w-full bg-background">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={`Cover of ${title}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 200px"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center text-sm text-text-muted">
              No cover
            </div>
          )}

          {/* Desktop hover overlay */}
          <div
            className="absolute inset-0 hidden flex-col items-stretch justify-end bg-puce-red/75 p-4 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 md:flex"
            aria-hidden={false}
          >
            <ResultActions
              onViewDetails={handleViewDetails}
              onAddToShelf={openShelfMenu}
              viewDetailsLoading={viewDetailsLoading}
              addDisabled={saving}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-2 font-semibold text-text">{title}</h3>
          {author ? (
            <p className="line-clamp-1 text-sm text-text-muted">{author}</p>
          ) : null}
        </div>

        {/* Mobile actions — always visible */}
        <div className="flex flex-col gap-2 border-t border-border px-4 pb-4 pt-3 md:hidden">
          <ResultActions
            onViewDetails={handleViewDetails}
            onAddToShelf={openShelfMenu}
            viewDetailsLoading={viewDetailsLoading}
            addDisabled={saving}
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
