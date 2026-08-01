"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FeatureLimitModal } from "@/components/premium/FeatureLimitModal";
import {
  createCustomShelf,
  validateCustomShelfInput,
} from "@/lib/services/customShelves";
import { SHELF_VISIBILITY_OPTIONS } from "@/lib/services/shelfVisibility";
import type { ShelfVisibility, UserShelf } from "@/types";
import { cn } from "@/lib/utils/cn";

function isCustomShelfLimitError(message: string): boolean {
  return /1 custom shelf|unlimited shelves/i.test(message);
}

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
  const [visibility, setVisibility] = useState<ShelfVisibility>("public");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitOpen, setLimitOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setGenre(initialGenre);
      setVisibility("public");
      setError(null);
    }
  }, [open, initialName, initialGenre]);

  function handleClose() {
    if (saving) return;
    setName("");
    setGenre("");
    setVisibility("public");
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validated = validateCustomShelfInput({
      name,
      genre: genre || null,
      visibility,
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
      if (isCustomShelfLimitError(result.error)) {
        setName("");
        setGenre("");
        setVisibility("public");
        setError(null);
        onClose();
        setLimitOpen(true);
        return;
      }
      setError(result.error);
      return;
    }

    if (result.shelf) {
      onCreated(result.shelf, result.booksAdded);
      setName("");
      setGenre("");
      setVisibility("public");
      setError(null);
      onClose();
    }
  }

  return (
    <>
    <FeatureLimitModal
      open={limitOpen}
      onClose={() => setLimitOpen(false)}
      featureLabel="Custom shelves"
      limitMessage="Free members can create 1 custom shelf. Upgrade to Bookmarked Plus for unlimited shelves."
    />
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

        <label className="mb-4 block">
          <span className="mb-1.5 block text-sm font-medium text-text">Privacy</span>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as ShelfVisibility)}
            className={cn(
              "min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text",
              "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            )}
            aria-label="Shelf visibility"
          >
            {SHELF_VISIBILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

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
    </>
  );
}
