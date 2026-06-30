"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { deleteCustomShelf } from "@/lib/services/customShelves";

type Props = {
  open: boolean;
  onClose: () => void;
  shelfId: string;
  shelfName: string;
  onDeleted: () => void;
};

export function DeleteCustomShelfModal({
  open,
  onClose,
  shelfId,
  shelfName,
  onDeleted,
}: Props) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    if (deleting) return;
    setError(null);
    onClose();
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const result = await deleteCustomShelf(shelfId);
    setDeleting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setError(null);
    onDeleted();
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title={`Delete ${shelfName}?`}>
      <p className="mb-4 text-sm text-text-muted">
        Books stay in your library. This only removes the shelf and its groupings.
      </p>

      {error ? (
        <p className="mb-4 text-sm text-rust" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={handleClose} disabled={deleting}>
          Cancel
        </Button>
        <Button
          type="button"
          loading={deleting}
          className="bg-rust text-white hover:opacity-90"
          onClick={() => void handleDelete()}
        >
          Delete shelf
        </Button>
      </div>
    </Modal>
  );
}
