"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { BookCover } from "@/components/books/BookCover";
import { ShelfSelectMenu } from "@/components/shelves/ShelfSelectMenu";
import { ShelfBadge } from "@/components/shelves/ShelfBadge";
import { AddToCustomShelfMenu } from "@/components/shelves/AddToCustomShelfMenu";
import {
  EditionPickerModal,
  type CatalogEditionSummary,
} from "@/components/search/EditionPickerModal";
import { useToast } from "@/components/ui/Toast";
import { MissingPageCountDialog } from "@/components/books/MissingPageCountDialog";
import {
  addCatalogBookToShelf,
  ensureCatalogBook,
} from "@/lib/services/books";
import { removeFromShelf } from "@/lib/actions/book";
import {
  addBookToCustomShelf,
  listCustomShelfIdsForBook,
  listUserCustomShelves,
} from "@/lib/services/customShelves";
import type { UserShelf } from "@/types";
import { needsMissingPageCountPrompt } from "@/lib/services/completeReadingSession";
import { resolveDisplayCoverUrl } from "@/lib/services/covers";
import { bookDetailsPath } from "@/lib/routes/book";
import { authorPagePath } from "@/lib/routes/author";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { cn } from "@/lib/utils/cn";
import type { ShelfStatus } from "@/types";
import {
  CURRENTLY_READING_ADD_EVENTS,
  currentlyReadingAddReturnHref,
  endCurrentlyReadingAddFromSearch,
  isCurrentlyReadingAddFromOverview,
  tryBeginCurrentlyReadingAddFromSearch,
} from "@bookmarked/utils/currentlyReadingAdd";
import { trackProductEvent } from "@/lib/services/productAnalytics";
import { withOriginQuery } from "@bookmarked/utils/navigationOrigin";

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
  /** Catalog book id, when this result is already in the shared `books` table. */
  bookId?: string | null;
  /** Current built-in shelf, when this result is already on the viewer's shelves. */
  shelfStatus?: ShelfStatus | null;
  /** Called after a successful add/move/remove so the search list can stay in sync. */
  onShelfMembershipChange?: (membership: { bookId: string; shelfStatus: ShelfStatus | null }) => void;
};

function ResultActions({
  onViewDetails,
  onAddToShelf,
  onPickEdition,
  onAddToCollection,
  onRemove,
  viewDetailsLoading,
  addLoading,
  removing,
  shelved,
  addLabel,
  editionLabel,
  overlay = false,
  className,
}: {
  onViewDetails: () => void;
  onAddToShelf: () => void;
  onPickEdition: () => void;
  onAddToCollection: () => void;
  onRemove?: () => void;
  viewDetailsLoading: boolean;
  addLoading: boolean;
  removing?: boolean;
  shelved: boolean;
  addLabel?: string;
  editionLabel?: string | null;
  overlay?: boolean;
  className?: string;
}) {
  const outlineButtonClass = overlay ? overlayOutlineButtonClass : undefined;
  const busy = addLoading || Boolean(removing);

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
        disabled={busy}
        onClick={onAddToShelf}
        className={outlineButtonClass}
      >
        {addLabel ?? (shelved ? "Move shelf" : "Add to shelf")}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={onAddToCollection}
        className={outlineButtonClass}
      >
        Add to collection
      </Button>
      {shelved && onRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          loading={removing}
          disabled={busy}
          onClick={onRemove}
          className={overlay ? "text-surface hover:bg-surface/20 hover:text-surface" : "text-rust"}
        >
          Remove from shelves
        </Button>
      ) : null}
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
  bookId = null,
  shelfStatus = null,
  onShelfMembershipChange,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthUser();
  const addFromOverview = isCurrentlyReadingAddFromOverview({
    origin: searchParams.get("origin"),
  });
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editionOpen, setEditionOpen] = useState(false);
  const [missingPageOpen, setMissingPageOpen] = useState(false);
  const [pendingShelf, setPendingShelf] = useState<ShelfStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [viewDetailsLoading, setViewDetailsLoading] = useState(false);
  const [selectedEdition, setSelectedEdition] = useState<CatalogEditionSummary | null>(
    null
  );
  const [resolvedCoverUrl, setResolvedCoverUrl] = useState<string | null>(coverUrl);
  const [customBookId, setCustomBookId] = useState<string | null>(null);
  const [resolvedBookId, setResolvedBookId] = useState<string | null>(bookId);
  const [optimisticShelf, setOptimisticShelf] = useState<ShelfStatus | null>(shelfStatus);
  const [memberShelfIds, setMemberShelfIds] = useState<string[]>([]);
  const [customShelves, setCustomShelves] = useState<UserShelf[]>([]);

  useEffect(() => {
    setResolvedBookId(bookId);
  }, [bookId]);

  useEffect(() => {
    setOptimisticShelf(shelfStatus);
  }, [shelfStatus]);

  useEffect(() => {
    if (!user) {
      setCustomShelves([]);
      return;
    }
    void listUserCustomShelves(user.id)
      .then(setCustomShelves)
      .catch((error) => console.error("[custom-shelf] list failed:", error));
  }, [user]);

  useEffect(() => {
    if (!user || !resolvedBookId) {
      setMemberShelfIds([]);
      return;
    }
    void listCustomShelfIdsForBook(user.id, resolvedBookId)
      .then(setMemberShelfIds)
      .catch((error) => console.error("[custom-shelf] membership load failed:", error));
  }, [user, resolvedBookId]);

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
      router.push(
        withOriginQuery(bookDetailsPath(result.bookId), {
          origin: "search_books",
          query: searchParams.get("q"),
          scroll: typeof window !== "undefined" ? Math.round(window.scrollY) : null,
        })
      );
    } finally {
      setViewDetailsLoading(false);
    }
  }

  function openShelfMenu() {
    if (addFromOverview) {
      if (saving) return;
      void submitShelf("currently_reading");
      return;
    }
    setMenuOpen(true);
  }

  async function openCustomShelfMenu() {
    setSaving(true);
    try {
      const result = await ensureCatalogBook(bookPayload);
      if (result.error || !result.bookId) {
        toast.error(result.error ?? "Could not prepare this book.");
        return;
      }
      setResolvedBookId(result.bookId);
      setCustomBookId(result.bookId);
    } finally {
      setSaving(false);
    }
  }

  async function submitShelf(
    shelfStatusToApply: ShelfStatus,
    options?: { manualPageCount?: number }
  ) {
    const overviewAdd = addFromOverview && shelfStatusToApply === "currently_reading";
    if (overviewAdd && !tryBeginCurrentlyReadingAddFromSearch()) return;
    const previousShelf = optimisticShelf;
    setOptimisticShelf(shelfStatusToApply);
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
    formData.set("shelf_status", shelfStatusToApply);
    if (options?.manualPageCount != null) {
      formData.set("manual_page_count", String(options.manualPageCount));
    }

    try {
      const result = await addCatalogBookToShelf({}, formData);
      if (result.error) {
        setOptimisticShelf(previousShelf);
        if (overviewAdd) endCurrentlyReadingAddFromSearch();
        toast.error(result.error || "Could not add book. Please try again.");
        return;
      }
      if (result.success) {
        toast.success(result.success);
        setMenuOpen(false);
        setMissingPageOpen(false);
        setPendingShelf(null);
        if (result.bookId) {
          setResolvedBookId(result.bookId);
          onShelfMembershipChange?.({ bookId: result.bookId, shelfStatus: shelfStatusToApply });
        }
        onBookmarked?.();
        if (overviewAdd) {
          trackProductEvent(CURRENTLY_READING_ADD_EVENTS.fromSearch, {
            book_id: result.bookId ?? "",
          });
          router.replace(currentlyReadingAddReturnHref());
        }
      }
    } catch (error) {
      setOptimisticShelf(previousShelf);
      if (overviewAdd) endCurrentlyReadingAddFromSearch();
      toast.error(error instanceof Error ? error.message : "Could not update shelf.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectShelf(shelfStatusToApply: ShelfStatus) {
    const catalogPageCount = bookPayload.page_count ? Number(bookPayload.page_count) : null;
    const editionSelected = Boolean(bookPayload.edition_key || bookPayload.isbn);

    if (
      shelfStatusToApply === "read" &&
      needsMissingPageCountPrompt({
        editionSelected,
        catalogPageCount,
        previousPage: 0,
      })
    ) {
      setPendingShelf(shelfStatusToApply);
      setMissingPageOpen(true);
      return;
    }

    await submitShelf(shelfStatusToApply);
  }

  async function handleRemove() {
    if (!resolvedBookId) return;
    const previousShelf = optimisticShelf;
    setOptimisticShelf(null);
    setRemoving(true);
    const formData = new FormData();
    formData.set("book_id", resolvedBookId);
    try {
      const result = await removeFromShelf({}, formData);
      if (result.error) {
        setOptimisticShelf(previousShelf);
        toast.error(result.error);
        return;
      }
      toast.success(result.success ?? "Removed from your library.");
      onShelfMembershipChange?.({ bookId: resolvedBookId, shelfStatus: null });
    } catch (error) {
      setOptimisticShelf(previousShelf);
      toast.error(error instanceof Error ? error.message : "Could not remove this book.");
    } finally {
      setRemoving(false);
    }
  }

  const editionLabel = selectedEdition
    ? [selectedEdition.publishDate, selectedEdition.publisher].filter(Boolean).join(" · ")
    : null;
  const shelved = Boolean(optimisticShelf);

  return (
    <>
      <article
        tabIndex={0}
        className="group flex h-full flex-col overflow-visible rounded-xl border border-border bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-primary/40 focus:outline-none"
      >
        <div className="relative aspect-[2/3] w-full">
          <BookCover
            title={title}
            author={author}
            coverUrl={resolvedCoverUrl}
            className="rounded-none border-0"
            sizes="(max-width: 768px) 50vw, 200px"
            bookmarked={bookmarked || shelved}
          />

          <div
            className="absolute inset-0 hidden flex-col items-stretch justify-end bg-puce-red/75 p-4 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 md:flex"
            aria-hidden={false}
          >
            <ResultActions
              overlay
              shelved={shelved}
              addLabel={addFromOverview ? "Add to Currently Reading" : undefined}
              onViewDetails={handleViewDetails}
              onAddToShelf={openShelfMenu}
              onAddToCollection={() => void openCustomShelfMenu()}
              onRemove={() => void handleRemove()}
              onPickEdition={() => setEditionOpen(true)}
              viewDetailsLoading={viewDetailsLoading}
              addLoading={saving}
              removing={removing}
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
          {optimisticShelf ? (
            <div className="flex justify-center">
              <ShelfBadge status={optimisticShelf} />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 border-t border-border px-4 pb-4 pt-3 md:hidden">
          <ResultActions
            shelved={shelved}
            addLabel={addFromOverview ? "Add to Currently Reading" : undefined}
            onViewDetails={handleViewDetails}
            onAddToShelf={openShelfMenu}
            onAddToCollection={() => void openCustomShelfMenu()}
            onRemove={() => void handleRemove()}
            onPickEdition={() => setEditionOpen(true)}
            viewDetailsLoading={viewDetailsLoading}
            addLoading={saving}
            removing={removing}
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
        currentShelfStatus={optimisticShelf}
        mode={optimisticShelf ? "move" : "add"}
        customShelves={customShelves}
        memberShelfIds={memberShelfIds}
        onSelectShelf={handleSelectShelf}
        onSelectCustom={async (shelf) => {
          if (!user) {
            toast.error("Sign in to add this book to a collection.");
            return;
          }
          setSaving(true);
          try {
            const ensured = await ensureCatalogBook(bookPayload);
            if (ensured.error || !ensured.bookId) {
              toast.error(ensured.error ?? "Could not prepare this book.");
              return;
            }
            setResolvedBookId(ensured.bookId);
            const result = await addBookToCustomShelf(shelf.id, user.id, ensured.bookId);
            if (result.error) {
              toast.error(result.error);
              return;
            }
            setMemberShelfIds((prev) => [...prev, shelf.id]);
            toast.success(`Added to ${shelf.name}`);
            setMenuOpen(false);
          } finally {
            setSaving(false);
          }
        }}
        onOpenCustomCollections={() => void openCustomShelfMenu()}
        onClose={() => {
          if (!saving) setMenuOpen(false);
        }}
      />

      {customBookId ? (
        <AddToCustomShelfMenu
          bookId={customBookId}
          bookTitle={bookPayload.title}
          open
          memberShelfIds={memberShelfIds}
          onAdded={(shelfId) => setMemberShelfIds((prev) => [...prev, shelfId])}
          onClose={() => setCustomBookId(null)}
        />
      ) : null}

      <MissingPageCountDialog
        bookTitle={bookPayload.title}
        open={missingPageOpen}
        loading={saving}
        onSaveWithPageCount={(manualPageCount) => {
          if (!pendingShelf) return;
          void submitShelf(pendingShelf, { manualPageCount });
        }}
        onSaveWithoutPageCount={() => {
          if (!pendingShelf) return;
          void submitShelf(pendingShelf);
        }}
        onClose={() => {
          if (!saving) {
            setMissingPageOpen(false);
            setPendingShelf(null);
          }
        }}
      />
    </>
  );
}
