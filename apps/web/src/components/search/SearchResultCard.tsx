"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { BookCover } from "@/components/books/BookCover";
import { ShelfSelectMenu } from "@/components/shelves/ShelfSelectMenu";
import {
  EditionPickerModal,
  type CatalogEditionSummary,
} from "@/components/search/EditionPickerModal";
import { useToast } from "@/components/ui/Toast";
import {
  addCatalogBookToShelf,
  ensureCatalogBook,
} from "@/lib/services/books";
import { resolveDisplayCoverUrl } from "@/lib/services/covers";
import { bookDetailsPath } from "@/lib/routes/book";
import { authorPagePath } from "@/lib/routes/author";
import { cn } from "@/lib/utils/cn";
import type { ShelfStatus } from "@/types";

/** Outline buttons on the desktop hover overlay (puce-red background). */
const overlayOutlineButtonClass =
  "border-surface bg-surface/90 text-puce-red hover:bg-surface";

type Props = {
  title: string;
  author: string | null;
  external_id: string;
  coverUrl: string | null;
  /** ISBNdb cover image URL to persist on add */
  cover_url?: string;
  /** @deprecated legacy Open Library cover id */
  cover_i?: string;
  page_count: string;
  isbn?: string;
  first_publish_year?: string;
  first_sentence?: string;
  bookmarked?: boolean;
  onBookmarked?: () => void;
};

function ResultActions({
  onViewDetails,
  onAddToShelf,
  onPickEdition,
  viewDetailsLoading,
  addLoading,
  editionLabel,
  overlay = false,
  className,
}: {
  onViewDetails: () => void;
  onAddToShelf: () => void;
  onPickEdition: () => void;
  viewDetailsLoading: boolean;
  addLoading: boolean;
  editionLabel?: string | null;
  overlay?: boolean;
  className?: string;
}) {
  const outlineButtonClass = overlay ? overlayOutlineButtonClass : undefined;

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
        onClick={onPickEdition}
        className={outlineButtonClass}
      >
        {editionLabel ? "Change edition" : "Pick edition"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        loading={addLoading}
        disabled={addLoading}
        onClick={onAddToShelf}
        className={outlineButtonClass}
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
  cover_url = "",
  page_count,
  isbn = "",
  first_publish_year = "",
  first_sentence = "",
  bookmarked = false,
  onBookmarked,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editionOpen, setEditionOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewDetailsLoading, setViewDetailsLoading] = useState(false);
  const [selectedEdition, setSelectedEdition] = useState<CatalogEditionSummary | null>(
    null
  );
  const [resolvedCoverUrl, setResolvedCoverUrl] = useState<string | null>(coverUrl);

  const effectiveIsbn = selectedEdition?.isbn ?? isbn;
  const effectivePageCount = selectedEdition?.pageCount
    ? String(selectedEdition.pageCount)
    : page_count;
  const effectiveYear = selectedEdition?.publishDate?.match(/\d{4}/)?.[0] ?? first_publish_year;
  const effectiveCoverUrl = selectedEdition?.coverUrl ?? cover_url ?? coverUrl ?? "";
  const effectiveExternalId = selectedEdition?.editionKey ?? external_id;

  useEffect(() => {
    setResolvedCoverUrl(
      resolveDisplayCoverUrl({
        coverUrl: selectedEdition?.coverUrl ?? coverUrl ?? cover_url,
        isbn: effectiveIsbn,
      })
    );
  }, [coverUrl, cover_url, selectedEdition, effectiveIsbn]);

  const bookPayload = {
    title: selectedEdition?.title ?? title,
    author,
    external_id: effectiveExternalId,
    cover_url: effectiveCoverUrl,
    page_count: effectivePageCount,
    isbn: effectiveIsbn,
    first_publish_year: effectiveYear,
    first_sentence,
    edition_key: selectedEdition?.editionKey,
  };

  async function handleViewDetails() {
    setViewDetailsLoading(true);
    try {
      const result = await ensureCatalogBook(bookPayload);
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
    formData.set("title", bookPayload.title);
    formData.set("author", author ?? "");
    formData.set("external_id", bookPayload.external_id);
    formData.set("cover_url", bookPayload.cover_url);
    formData.set("page_count", bookPayload.page_count);
    formData.set("isbn", bookPayload.isbn);
    formData.set("first_publish_year", bookPayload.first_publish_year);
    formData.set("first_sentence", first_sentence);
    if (bookPayload.edition_key) {
      formData.set("edition_key", bookPayload.edition_key);
    }
    formData.set("shelf_status", shelfStatus);

    try {
      const result = await addCatalogBookToShelf({}, formData);
      if (result.error) {
        toast.error(result.error || "Could not add book. Please try again.");
        return;
      }
      if (result.success) {
        toast.success(result.success);
        setMenuOpen(false);
        onBookmarked?.();
      }
    } finally {
      setSaving(false);
    }
  }

  const editionLabel = selectedEdition
    ? [selectedEdition.publishDate, selectedEdition.publisher].filter(Boolean).join(" · ")
    : null;

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
            bookmarked={bookmarked}
          />

          <div
            className="absolute inset-0 hidden flex-col items-stretch justify-end bg-puce-red/75 p-4 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 md:flex"
            aria-hidden={false}
          >
            <ResultActions
              overlay
              onViewDetails={handleViewDetails}
              onAddToShelf={openShelfMenu}
              onPickEdition={() => setEditionOpen(true)}
              viewDetailsLoading={viewDetailsLoading}
              addLoading={saving}
              editionLabel={editionLabel}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4 text-center">
          <h3 className="line-clamp-2 font-semibold text-text">
            {selectedEdition?.title ?? title}
          </h3>
          {author ? (
            <p className="line-clamp-1 text-sm text-text-muted">
              <Link href={authorPagePath(author)} className="hover:text-primary hover:underline">
                {author}
              </Link>
            </p>
          ) : null}
          {editionLabel ? (
            <p className="text-xs text-primary">Edition: {editionLabel}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 border-t border-border px-4 pb-4 pt-3 md:hidden">
          <ResultActions
            onViewDetails={handleViewDetails}
            onAddToShelf={openShelfMenu}
            onPickEdition={() => setEditionOpen(true)}
            viewDetailsLoading={viewDetailsLoading}
            addLoading={saving}
            editionLabel={editionLabel}
          />
        </div>
      </article>

      <EditionPickerModal
        open={editionOpen}
        workId={external_id}
        workTitle={title}
        onClose={() => setEditionOpen(false)}
        onSelect={(edition) => {
          setSelectedEdition(edition);
          toast.success("Edition selected.");
        }}
      />

      <ShelfSelectMenu
        bookTitle={bookPayload.title}
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
