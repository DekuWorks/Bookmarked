"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CustomShelfIconPicker } from "@/components/shelves/CustomShelfIconPicker";
import {
  updateCustomShelf,
  validateCustomShelfInput,
} from "@/lib/services/customShelves";
import { SHELF_VISIBILITY_OPTIONS } from "@/lib/services/shelfVisibility";
import {
  resolveCustomShelfIconKey,
  type CustomShelfIconKey,
} from "@/lib/constants/shelfIcons";
import type { ShelfVisibility, UserShelf } from "@/types";
import { cn } from "@/lib/utils/cn";

type ShelfLike = Pick<UserShelf, "id" | "name" | "genre" | "visibility"> & {
  icon_key?: string | null;
};

type Props = {
  open: boolean;
  shelf: ShelfLike | null;
  onClose: () => void;
  onSaved: (shelf: UserShelf) => void;
};

export function EditCustomShelfModal({ open, shelf, onClose, onSaved }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Edit shelf">
      {shelf ? (
        <EditCustomShelfForm
          key={`${shelf.id}:${shelf.updated_at ?? shelf.icon_key ?? ""}:${open ? "open" : "closed"}`}
          shelf={shelf}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : null}
    </Modal>
  );
}

function EditCustomShelfForm({
  shelf,
  onClose,
  onSaved,
}: {
  shelf: ShelfLike & { updated_at?: string };
  onClose: () => void;
  onSaved: (shelf: UserShelf) => void;
}) {
  const [name, setName] = useState(shelf.name);
  const [genre, setGenre] = useState(shelf.genre ?? "");
  const [visibility, setVisibility] = useState<ShelfVisibility>(shelf.visibility);
  const [iconKey, setIconKey] = useState<CustomShelfIconKey>(
    resolveCustomShelfIconKey(shelf.icon_key)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    if (saving) return;
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validated = validateCustomShelfInput({
      name,
      genre: genre || null,
      visibility,
      icon_key: iconKey,
    });
    if (!validated.ok) {
      setError(validated.error);
      return;
    }

    setSaving(true);
    const result = await updateCustomShelf(shelf.id, validated.value);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.shelf) {
      onSaved(result.shelf);
      onClose();
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)}>
      <Input
        label="Shelf name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
        required
      />
      <Input
        label="Genre (optional)"
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
        maxLength={80}
      />
      <CustomShelfIconPicker value={iconKey} onChange={setIconKey} disabled={saving} />
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
          Save
        </Button>
      </div>
    </form>
  );
}
