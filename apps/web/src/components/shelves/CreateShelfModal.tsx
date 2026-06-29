"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createCustomShelf } from "@/lib/services/customShelves";
import type { UserShelf } from "@/types";

type Props = {
  open: boolean;
  userId: string;
  onClose: () => void;
  onCreated: (shelf: UserShelf) => void;
};

export function CreateShelfModal({ open, userId, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    if (saving) return;
    setName("");
    setGenre("");
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const result = await createCustomShelf(userId, {
      name,
      genre: genre.trim() || null,
    });

    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.shelf) {
      onCreated(result.shelf);
      setName("");
      setGenre("");
      setError(null);
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Create a shelf">
      <form onSubmit={(e) => void handleSubmit(e)}>
        <p className="mb-4 text-sm text-text-muted">
          Name your shelf and optionally tag it with a genre — like &ldquo;Summer
          reads&rdquo; or &ldquo;Sci-fi favorites&rdquo;.
        </p>

        <Input
          label="Shelf name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Beach reads"
          maxLength={80}
          required
          autoFocus
        />

        <Input
          label="Genre (optional)"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          placeholder="e.g. Mystery, Romance"
          maxLength={80}
        />

        {error ? (
          <p className="mb-4 text-sm text-rust" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="secondary" loading={saving}>
            Create shelf
          </Button>
        </div>
      </form>
    </Modal>
  );
}
