"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SHELF_CONFIG } from "@/lib/constants/shelves";
import type { ShelfStatus } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  bookTitle: string;
  open: boolean;
  loading?: boolean;
  currentShelfStatus?: ShelfStatus | null;
  mode?: "add" | "move";
  onSelectShelf: (status: ShelfStatus) => void;
  onClose: () => void;
};

export function ShelfSelectMenu({
  bookTitle,
  open,
  loading = false,
  currentShelfStatus = null,
  mode = "add",
  onSelectShelf,
  onClose,
}: Props) {
  const title = mode === "move" ? "Move to shelf" : "Add to shelf";

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="mb-4 text-sm text-text-muted">
        Choose a shelf for <span className="font-medium text-text">{bookTitle}</span>
      </p>
      <ul className="space-y-2" role="listbox" aria-label="Shelf options">
        {SHELF_CONFIG.map(({ status, title: shelfTitle, emoji }) => {
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
                  "flex min-h-[44px] w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition disabled:opacity-50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange",
                  isCurrent
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:border-primary hover:bg-primary/5"
                )}
              >
                <span aria-hidden className="text-lg">
                  {emoji}
                </span>
                <span className="flex-1 font-medium text-text">{shelfTitle}</span>
                {isCurrent ? (
                  <span className="text-xs font-medium text-primary">Current</span>
                ) : null}
              </button>
            </li>
          );
        })}
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
