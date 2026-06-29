"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ShelfSelectMenu } from "@/components/shelves/ShelfSelectMenu";
import { AddToCustomShelfMenu } from "@/components/shelves/AddToCustomShelfMenu";
import { useToast } from "@/components/ui/Toast";
import {
  removeFromShelf,
  setBookShelfStatus,
  toggleFavorite,
  type BookActionState,
} from "@/lib/actions/book";
import { SHELF_CONFIG } from "@/lib/constants/shelves";
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
};

export function BookShelfActions({
  bookId,
  bookTitle,
  currentShelf,
  isFavorite = false,
}: Props) {
  const user = useAuthUser();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [customMenuOpen, setCustomMenuOpen] = useState(false);
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

  useEffect(() => {
    if (removeState.error) toast.error(removeState.error);
    if (removeState.success) toast.success(removeState.success);
  }, [removeState, toast]);

  useEffect(() => {
    if (favState.error) toast.error(favState.error);
    if (favState.success) toast.success(favState.success);
  }, [favState, toast]);

  async function applyShelf(shelfStatus: ShelfStatus) {
    setPending(true);
    const formData = new FormData();
    formData.set("book_id", bookId);
    formData.set("shelf_status", shelfStatus);
    try {
      const result = await setBookShelfStatus({}, formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.success) {
        toast.success(result.success);
        setMenuOpen(false);
      }
    } finally {
      setPending(false);
    }
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
            {SHELF_CONFIG.map(({ status, title }) => (
              <Button
                key={status}
                type="button"
                variant="outline"
                size="sm"
                loading={pending}
                onClick={() => applyShelf(status)}
              >
                {title}
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
