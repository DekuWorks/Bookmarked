"use client";

import { useState } from "react";
import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { StarDisplay } from "@/components/reviews/StarDisplay";
import { ShelfSelectMenu } from "@/components/shelves/ShelfSelectMenu";
import { AddToCustomShelfMenu } from "@/components/shelves/AddToCustomShelfMenu";
import { MissingPageCountDialog } from "@/components/books/MissingPageCountDialog";
import { useToast } from "@/components/ui/Toast";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { setBookShelfStatus } from "@/lib/actions/book";
import { listCustomShelfIdsForBook } from "@/lib/services/customShelves";
import { needsMissingPageCountPrompt } from "@/lib/services/completeReadingSession";
import { bookDetailsPath, bookDetailsReviewsPath } from "@/lib/routes/book";
import { feedOriginExtras } from "@/lib/feedNav";
import type { TrendingBook } from "@/lib/services/trending";
import type { ShelfStatus } from "@/types";
import {
  DISCOVERY_CARD_ROW_PX,
  clampDiscoveryTags,
  discoveryReviewState,
  discoveryReviewSummaryLabel,
} from "@bookmarked/utils/discoveryCard";
import { formatRatingCount } from "@bookmarked/utils/communityRating";

type Props = {
  book: TrendingBook & {
    reviewPreview?: string | null;
    tags?: string[] | null;
    hasWrittenReview?: boolean;
  };
};

/**
 * Equal-height discovery carousel card.
 * Fixed-height rows (`DISCOVERY_CARD_ROW_PX`) with overflow hidden keep covers/titles
 * aligned across rating/review/tag variance.
 */
export function DiscoveryBookCard({ book }: Props) {
  const user = useAuthUser();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [missingPageOpen, setMissingPageOpen] = useState(false);
  const [pendingShelf, setPendingShelf] = useState<ShelfStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [memberShelfIds, setMemberShelfIds] = useState<string[]>([]);

  const hasRating = Boolean(book.communityRating);
  const hasWritten = Boolean(book.hasWrittenReview || book.reviewPreview?.trim());
  const reviewState = discoveryReviewState({
    hasRating,
    hasWrittenReview: hasWritten,
  });
  const tags = clampDiscoveryTags(book.tags);
  const summary = discoveryReviewSummaryLabel(reviewState);
  const detailsHref = bookDetailsPath(book.bookId, feedOriginExtras());
  const reviewHref = bookDetailsReviewsPath(book.bookId, feedOriginExtras());

  async function submitShelf(shelfStatus: ShelfStatus, options?: { manualPageCount?: number }) {
    setSaving(true);
    const formData = new FormData();
    formData.set("book_id", book.bookId);
    formData.set("shelf_status", shelfStatus);
    if (options?.manualPageCount != null) {
      formData.set("manual_page_count", String(options.manualPageCount));
    }
    try {
      const result = await setBookShelfStatus({}, formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result.success ?? "Added to your shelf.");
      setMenuOpen(false);
      setMissingPageOpen(false);
      setPendingShelf(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update shelf.");
    } finally {
      setSaving(false);
    }
  }

  async function applyShelf(shelfStatus: ShelfStatus) {
    if (
      shelfStatus === "read" &&
      needsMissingPageCountPrompt({
        editionSelected: false,
        catalogPageCount: null,
        previousPage: 0,
      })
    ) {
      setPendingShelf(shelfStatus);
      setMissingPageOpen(true);
      return;
    }
    await submitShelf(shelfStatus);
  }

  async function openCustomCollections() {
    if (!user) {
      toast.error("Sign in to add this book to a collection.");
      return;
    }
    setMenuOpen(false);
    try {
      const ids = await listCustomShelfIdsForBook(user.id, book.bookId);
      setMemberShelfIds(ids);
    } catch {
      setMemberShelfIds([]);
    }
    setCustomOpen(true);
  }

  return (
    <li className="flex w-[7.5rem] shrink-0 flex-col">
      <Link
        href={detailsHref}
        className="group flex h-full flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
      >
        <div
          className="relative w-[7.5rem] shrink-0 overflow-hidden rounded-lg border border-border bg-white shadow-sm"
          style={{ height: DISCOVERY_CARD_ROW_PX.coverHeight }}
        >
          <BookCover
            title={book.title}
            author={book.author}
            coverUrl={book.coverUrl}
            className="h-full w-full"
            sizes="120px"
          />
        </div>

        <p
          className="mt-2 line-clamp-2 overflow-hidden text-xs font-semibold leading-snug text-text group-hover:text-puce-red"
          style={{ height: DISCOVERY_CARD_ROW_PX.title }}
        >
          {book.title}
        </p>

        <p
          className="mt-0.5 line-clamp-1 overflow-hidden text-[11px] text-text-muted"
          style={{ height: DISCOVERY_CARD_ROW_PX.author }}
        >
          {book.author?.trim() || "\u00a0"}
        </p>

        <div
          className="mt-1 flex items-center gap-1 overflow-hidden"
          style={{ height: DISCOVERY_CARD_ROW_PX.rating }}
        >
          {book.communityRating ? (
            <>
              <StarDisplay rating={book.communityRating.averageRating} showNumeric />
              <span className="text-[10px] text-text-muted">
                ({formatRatingCount(book.communityRating.ratingCount)})
              </span>
            </>
          ) : (
            <p className="line-clamp-1 text-[11px] text-text-muted">{summary}</p>
          )}
        </div>

        <p
          className="mt-1 line-clamp-2 overflow-hidden text-[11px] italic text-text-muted"
          style={{ height: DISCOVERY_CARD_ROW_PX.review }}
        >
          {book.reviewPreview?.trim() || "\u00a0"}
        </p>

        <div
          className="mt-1 flex flex-wrap gap-1 overflow-hidden"
          style={{ height: DISCOVERY_CARD_ROW_PX.tags }}
        >
          {tags.length
            ? tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-puce-red"
                >
                  {tag}
                </span>
              ))
            : null}
        </div>

        <p
          className="mt-auto overflow-hidden pt-1 text-[11px] font-medium text-primary"
          style={{ height: DISCOVERY_CARD_ROW_PX.metric }}
        >
          {book.metric} {book.metricLabel}
        </p>
      </Link>

      <div className="mt-2 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="min-h-[32px] rounded-md border border-border px-1.5 text-[11px] font-medium text-text hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
        >
          Add to Shelf
        </button>
        <Link
          href={reviewHref}
          className="min-h-[32px] rounded-md px-1.5 text-center text-[11px] font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
        >
          Rate & Review
        </Link>
      </div>

      <ShelfSelectMenu
        bookTitle={book.title}
        open={menuOpen}
        loading={saving}
        mode="add"
        onSelectShelf={applyShelf}
        onOpenCustomCollections={() => void openCustomCollections()}
        onClose={() => {
          if (!saving) setMenuOpen(false);
        }}
      />

      <AddToCustomShelfMenu
        bookId={book.bookId}
        bookTitle={book.title}
        open={customOpen}
        memberShelfIds={memberShelfIds}
        onAdded={(shelfId) => setMemberShelfIds((prev) => [...prev, shelfId])}
        onClose={() => setCustomOpen(false)}
      />

      <MissingPageCountDialog
        bookTitle={book.title}
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
    </li>
  );
}
