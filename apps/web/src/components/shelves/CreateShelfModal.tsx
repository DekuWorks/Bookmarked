"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  createCustomShelf,
  validateCustomShelfInput,
} from "@/lib/services/customShelves";
import type { UserShelf } from "@/types";

type Props = {
  open: boolean;
  userId: string;
  initialName?: string;
  initialGenre?: string;
  matchingBookIds?: string[];
  resolveMatchingBookIds?: (genre: string | null) => string[];
  onClose: () => void;
  onCreated: (shelf: UserShelf, booksAdded?: number) => void;
};

export function CreateShelfModal({
  open,
  userId,
  initialName = "",
  initialGenre = "",
  matchingBookIds = [],
  resolveMatchingBookIds,
  onClose,
  onCreated,
}: Props) {
  const [name, setName] = useState(initialName);
  const [genre, setGenre] = useState(initialGenre);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setGenre(initialGenre);
      setError(null);
    }
  }, [open, initialName, initialGenre]);

  function handleClose() {
    if (saving) return;
    setName("");
    setGenre("");
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validated = validateCustomShelfInput({
      name,
      genre: genre || null,
    });
    if (!validated.ok) {
      setError(validated.error);
      return;
    }

    setSaving(true);

    const bookIds = resolveMatchingBookIds
      ? resolveMatchingBookIds(validated.value.genre)
      : matchingBookIds;

    const result = await createCustomShelf(userId, validated.value, {
      bookIds,
    });

    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.shelf) {
      onCreated(result.shelf, result.booksAdded);
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
