"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SHELF_CONFIG } from "@/lib/constants/shelves";
import type { ShelfStatus } from "@/types";

type Props = {
  bookTitle: string;
  open: boolean;
  loading?: boolean;
  onSelectShelf: (status: ShelfStatus) => void;
  onClose: () => void;
};

export function ShelfSelectMenu({
  bookTitle,
  open,
  loading = false,
  onSelectShelf,
  onClose,
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Add to shelf">
      <p className="mb-4 text-sm text-text-muted">
        Choose a shelf for <span className="font-medium text-text">{bookTitle}</span>
      </p>
      <ul className="space-y-2" role="listbox" aria-label="Shelf options">
        {SHELF_CONFIG.map(({ status, title, emoji }) => (
          <li key={status}>
            <button
              type="button"
              role="option"
              disabled={loading}
              onClick={() => onSelectShelf(status)}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-left transition hover:border-primary hover:bg-primary/5 disabled:opacity-50"
            >
              <span aria-hidden className="text-lg">
                {emoji}
              </span>
              <span className="font-medium text-text">{title}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
      </div>
      {loading ? (
        <p className="mt-3 text-center text-sm text-text-muted" role="status">
          Adding…
        </p>
      ) : null}
    </Modal>
  );
}
