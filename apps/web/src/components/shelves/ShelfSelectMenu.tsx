"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ShelfIcon } from "@/components/shelves/ShelfIcon";
import { getShelvesInOrder } from "@/lib/constants/shelves";
import type { ShelfStatus, UserShelf } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  bookTitle: string;
  open: boolean;
  loading?: boolean;
  currentShelfStatus?: ShelfStatus | null;
  mode?: "add" | "move";
  onSelectShelf: (status: ShelfStatus) => void;
  onClose: () => void;
  customShelves?: UserShelf[];
  memberShelfIds?: string[];
  onSelectCustom?: (shelf: UserShelf) => void;
  /** Opens the existing custom-collection picker from this same action. */
  onOpenCustomCollections?: () => void;
};

export function ShelfSelectMenu({
  bookTitle,
  open,
  loading = false,
  currentShelfStatus = null,
  mode = "add",
  onSelectShelf,
  onClose,
  customShelves = [],
  memberShelfIds = [],
  onSelectCustom,
  onOpenCustomCollections,
}: Props) {
  const title = mode === "move" ? "Move to shelf" : "Add to shelf";

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="mb-4 text-sm text-text-muted">
        Choose a shelf for <span className="font-medium text-text">{bookTitle}</span>
      </p>
      <ul className="space-y-2" role="listbox" aria-label="Shelf options">
        {getShelvesInOrder().map(({ status, title: shelfTitle }) => {
          const isCurrent = currentShelfStatus === status;
          return (
            <li key={status}>
              <button
                type="button"
                role="option"
                aria-selected={isCurrent}
                disabled={loading || isCurrent}
                onClick={() => onSelectShelf(status)}
                className={cn(
                  "flex min-h-[44px] w-full items-center gap-2 rounded-lg border px-4 py-3 text-left transition disabled:opacity-50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange",
                  isCurrent
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:border-primary hover:bg-primary/5"
                )}
              >
                <ShelfIcon id={status} size="medium" />
                <span className="flex-1 font-medium leading-tight text-text">{shelfTitle}</span>
                {isCurrent ? (
                  <span className="text-xs font-medium text-primary">Current</span>
                ) : null}
              </button>
            </li>
          );
        })}
        {customShelves.map((shelf) => {
          const isMember = memberShelfIds.includes(shelf.id);
          return (
            <li key={shelf.id}>
              <button
                type="button"
                role="option"
                aria-selected={isMember}
                disabled={loading || isMember || !onSelectCustom}
                onClick={() => onSelectCustom?.(shelf)}
                className={cn(
                  "flex min-h-[44px] w-full items-center gap-2 rounded-lg border px-4 py-3 text-left transition disabled:opacity-50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange",
                  isMember
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:border-primary hover:bg-primary/5"
                )}
              >
                <ShelfIcon iconKey={shelf.icon_key} size="medium" />
                <span className="flex-1 font-medium leading-tight text-text">{shelf.name}</span>
                {isMember ? (
                  <span className="text-xs font-medium text-primary">On shelf</span>
                ) : null}
              </button>
            </li>
          );
        })}
        {onOpenCustomCollections && customShelves.length === 0 ? (
          <li>
            <button
              type="button"
              disabled={loading}
              onClick={onOpenCustomCollections}
              className={cn(
                "flex min-h-[44px] w-full items-center gap-2 rounded-lg border px-4 py-3 text-left transition disabled:opacity-50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange",
                "border-border bg-background hover:border-primary hover:bg-primary/5"
              )}
            >
              <ShelfIcon iconKey={null} size="medium" />
              <span className="flex-1 font-medium leading-tight text-text">Custom collections</span>
            </button>
          </li>
        ) : null}
      </ul>
      <div className="mt-4 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
      </div>
      {loading ? (
        <p className="mt-3 text-center text-sm text-text-muted" role="status">
          Saving…
        </p>
      ) : null}
    </Modal>
  );
}
