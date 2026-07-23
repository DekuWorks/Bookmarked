"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ShelfSelectMenu } from "@/components/shelves/ShelfSelectMenu";
import { MissingPageCountDialog } from "@/components/books/MissingPageCountDialog";
import { AddToCustomShelfMenu } from "@/components/shelves/AddToCustomShelfMenu";
import { useToast } from "@/components/ui/Toast";
import { useActionToast } from "@/lib/hooks/useActionToast";
import {
  removeFromShelf,
  setBookShelfStatus,
  toggleFavorite,
  type BookActionState,
} from "@/lib/actions/book";
import { needsMissingPageCountPrompt } from "@/lib/services/completeReadingSession";
import { getShelvesInOrder } from "@/lib/constants/shelves";
import { ShelfIcon } from "@/components/shelves/ShelfIcon";
import { listCustomShelfIdsForBook } from "@/lib/services/customShelves";
import { ShelfBadge } from "@/components/shelves/ShelfBadge";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import type { ShelfStatus } from "@/types";

const initial: BookActionState = {};

type Props = {
  bookId: string;
  bookTitle: string;
  currentShelf: ShelfStatus | null;
  isFavorite?: boolean;
  pageCount?: number | null;
  editionSelected?: boolean;
  previousPage?: number;
};

export function BookShelfActions({
  bookId,
  bookTitle,
  currentShelf,
  isFavorite = false,
  pageCount = null,
  editionSelected = false,
  previousPage = 0,
}: Props) {
  const user = useAuthUser();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [customMenuOpen, setCustomMenuOpen] = useState(false);
  const [missingPageOpen, setMissingPageOpen] = useState(false);
  const [pendingShelf, setPendingShelf] = useState<ShelfStatus | null>(null);
  const [pending, setPending] = useState(false);
  const [memberShelfIds, setMemberShelfIds] = useState<string[]>([]);
  const [removeState, removeAction, removing] = useActionState(removeFromShelf, initial);
  const [favState, favAction, favoriting] = useActionState(toggleFavorite, initial);

  useEffect(() => {
    if (!user) return;
    void listCustomShelfIdsForBook(user.id, bookId)
      .then(setMemberShelfIds)
      .catch((error) => console.error("[custom-shelf] membership load failed:", error));
  }, [user, bookId]);

  useActionToast(removeState);
  useActionToast(favState);

  async function submitShelf(
    shelfStatus: ShelfStatus,
    options?: { manualPageCount?: number }
  ) {
    setPending(true);
    const formData = new FormData();
    formData.set("book_id", bookId);
    formData.set("shelf_status", shelfStatus);
    if (editionSelected) formData.set("edition_selected", "true");
    if (pageCount != null && pageCount > 0) {
      formData.set("catalog_page_count", String(pageCount));
    }
    if (options?.manualPageCount != null) {
      formData.set("manual_page_count", String(options.manualPageCount));
    }

    try {
      const result = await setBookShelfStatus({}, formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.success) {
        toast.success(result.success);
        setMenuOpen(false);
        setMissingPageOpen(false);
        setPendingShelf(null);
      }
    } finally {
      setPending(false);
    }
  }

  async function applyShelf(shelfStatus: ShelfStatus) {
    if (
      shelfStatus === "read" &&
      needsMissingPageCountPrompt({
        editionSelected,
        catalogPageCount: pageCount,
        previousPage,
      })
    ) {
      setPendingShelf(shelfStatus);
      setMissingPageOpen(true);
      return;
    }

    await submitShelf(shelfStatus);
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold text-puce-red">Your shelf</h2>
      {currentShelf ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <ShelfBadge status={currentShelf} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMenuOpen(true)}
            disabled={pending}
          >
            Move shelf
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCustomMenuOpen(true)}
          >
            Add to collection
          </Button>
          <form action={favAction} className="inline">
            <input type="hidden" name="book_id" value={bookId} />
            <Button type="submit" variant="ghost" size="sm" loading={favoriting}>
              {isFavorite ? "★ Favorited" : "☆ Add to favorites"}
            </Button>
          </form>
          <form action={removeAction} className="inline">
            <input type="hidden" name="book_id" value={bookId} />
            <Button type="submit" variant="ghost" size="sm" loading={removing}>
              Remove
            </Button>
          </form>
        </div>
      ) : (
        <div className="mt-4">
          <p className="mb-3 text-sm text-text-muted">Not on your shelves yet.</p>
          <div className="flex flex-wrap gap-2">
            {getShelvesInOrder().map(({ status, title }) => (
              <Button
                key={status}
                type="button"
                variant="outline"
                size="sm"
                loading={pending}
                onClick={() => applyShelf(status)}
              >
                <span className="inline-flex items-center gap-1.5">
                  <ShelfIcon id={status} size="small" />
                  {title}
                </span>
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCustomMenuOpen(true)}
            >
              Add to collection
            </Button>
          </div>
        </div>
      )}

      <ShelfSelectMenu
        bookTitle={bookTitle}
        open={menuOpen}
        loading={pending}
        currentShelfStatus={currentShelf}
        mode={currentShelf ? "move" : "add"}
        onSelectShelf={applyShelf}
        onClose={() => {
          if (!pending) setMenuOpen(false);
        }}
      />

      <MissingPageCountDialog
        bookTitle={bookTitle}
        open={missingPageOpen}
        loading={pending}
        onSaveWithPageCount={(manualPageCount) => {
          if (!pendingShelf) return;
          void submitShelf(pendingShelf, { manualPageCount });
        }}
        onSaveWithoutPageCount={() => {
          if (!pendingShelf) return;
          void submitShelf(pendingShelf);
        }}
        onClose={() => {
          if (!pending) {
            setMissingPageOpen(false);
            setPendingShelf(null);
          }
        }}
      />

      <AddToCustomShelfMenu
        bookId={bookId}
        bookTitle={bookTitle}
        open={customMenuOpen}
        memberShelfIds={memberShelfIds}
        onAdded={(shelfId) => setMemberShelfIds((prev) => [...prev, shelfId])}
        onClose={() => setCustomMenuOpen(false)}
      />
    </section>
  );
}
