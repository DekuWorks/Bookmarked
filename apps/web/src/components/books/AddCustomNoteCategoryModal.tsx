"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  createCustomNoteCategory,
  MAX_CUSTOM_CATEGORY_LABEL_LENGTH,
  MIN_CUSTOM_CATEGORY_LABEL_LENGTH,
} from "@/lib/services/noteCategories";
import { customCategoryValue } from "@/lib/readingNotes/categories";
import type { ReadingNoteCategory } from "@/types";

type Props = {
  open: boolean;
  userId: string;
  onClose: () => void;
  onCreated: (category: ReadingNoteCategory) => void;
};

export function AddCustomNoteCategoryModal({ open, userId, onClose, onCreated }: Props) {
  const toast = useToast();
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("");
  const [saving, setSaving] = useState(false);

  function handleClose() {
    if (saving) return;
    setLabel("");
    setEmoji("");
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await createCustomNoteCategory(userId, label, emoji || null);
    setSaving(false);

    if (result.error || !result.category) {
      toast.error(result.error ?? "Could not create category.");
      return;
    }

    toast.success("Category created.");
    onCreated(customCategoryValue(result.category.id));
    setLabel("");
    setEmoji("");
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add custom category">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <Input
          label="Category name"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Worldbuilding"
          maxLength={MAX_CUSTOM_CATEGORY_LABEL_LENGTH}
          autoFocus
        />
        <p className="-mt-2 text-xs text-text-muted">
          {MIN_CUSTOM_CATEGORY_LABEL_LENGTH}–{MAX_CUSTOM_CATEGORY_LABEL_LENGTH} characters.
        </p>
        <Input
          label="Emoji (optional)"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          placeholder="🏷️"
          maxLength={8}
        />
        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          <Button type="submit" loading={saving} className="min-h-[44px] w-full sm:w-auto">
            Create category
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={saving}
            className="min-h-[44px] w-full sm:w-auto"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
