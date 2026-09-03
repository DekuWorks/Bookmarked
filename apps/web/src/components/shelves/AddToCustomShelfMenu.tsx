"use client";

import { useEffect, useState } from "react";
import { ShelfIcon } from "@/components/shelves/ShelfIcon";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  addBookToCustomShelf,
  listUserCustomShelves,
} from "@/lib/services/customShelves";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useToast } from "@/components/ui/Toast";
import type { UserShelf } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  bookId: string;
  bookTitle: string;
  open: boolean;
  onClose: () => void;
  memberShelfIds?: string[];
  onAdded?: (shelfId: string) => void;
};

export function AddToCustomShelfMenu({
  bookId,
  bookTitle,
  open,
  onClose,
  memberShelfIds = [],
  onAdded,
}: Props) {
  const user = useAuthUser();
  const toast = useToast();
  const [shelves, setShelves] = useState<UserShelf[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingShelfId, setSavingShelfId] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<Set<string>>(() => new Set(memberShelfIds));

  useEffect(() => {
    setMemberships(new Set(memberShelfIds));
  }, [memberShelfIds]);

  useEffect(() => {
    if (!open || !user) return;

    setLoading(true);
    void listUserCustomShelves(user.id)
      .then(setShelves)
      .catch((error) => {
        console.error("[custom-shelf] list failed:", error);
        toast.error("Could not load your shelves.");
      })
      .finally(() => setLoading(false));
  }, [open, user, toast]);

  async function handleSelect(shelf: UserShelf) {
    if (!user || memberships.has(shelf.id)) return;

    setSavingShelfId(shelf.id);
    const result = await addBookToCustomShelf(shelf.id, user.id, bookId);
    setSavingShelfId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setMemberships((prev) => new Set(prev).add(shelf.id));
    toast.success(`Added to ${shelf.name}`);
    onAdded?.(shelf.id);
  }

  return (
    <Modal open={open} onClose={onClose} title="Add to collection">
      <p className="mb-4 text-sm text-text-muted">
        Add <span className="font-medium text-text">{bookTitle}</span> to one of your custom
        shelves.
      </p>

      {loading ? (
        <p className="text-sm text-text-muted">Loading shelves…</p>
      ) : shelves.length === 0 ? (
        <p className="text-sm text-text-muted">
          You don&apos;t have any custom shelves yet. Create one from your library or reading
          room.
        </p>
      ) : (
        <ul className="space-y-2" role="listbox" aria-label="Custom shelf options">
          {shelves.map((shelf) => {
            const isMember = memberships.has(shelf.id);
            const isSaving = savingShelfId === shelf.id;
            return (
              <li key={shelf.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isMember}
                  disabled={isMember || isSaving}
                  onClick={() => void handleSelect(shelf)}
                  className={cn(
                    "flex min-h-[44px] w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition disabled:opacity-50",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange",
                    isMember
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary hover:bg-primary/5"
                  )}
                >
                  <ShelfIcon id="want_to_read" size="medium" />
                  <span className="flex-1">
                    <span className="block font-medium text-text">{shelf.name}</span>
                    {shelf.genre ? (
                      <span className="text-xs text-text-muted">{shelf.genre}</span>
                    ) : null}
                  </span>
                  {isMember ? (
                    <span className="text-xs font-medium text-primary">Added</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
