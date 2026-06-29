"use client";

import { useCallback, useEffect, useState } from "react";
import { CreateShelfModal } from "@/components/shelves/CreateShelfModal";
import { createCustomShelf } from "@/lib/services/customShelves";
import {
  getSuggestedShelves,
  type SuggestedShelf,
} from "@/lib/services/suggestedShelves";
import { getUserLibraryBooks } from "@/lib/services/library";
import { getProfile } from "@/lib/services/profile";
import { useToast } from "@/components/ui/Toast";
import type { UserShelf } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  userId: string;
  className?: string;
  onShelfCreated?: (shelf: UserShelf) => void;
};

export function SuggestedShelvesPanel({ userId, className, onShelfCreated }: Props) {
  const toast = useToast();
  const [suggestions, setSuggestions] = useState<SuggestedShelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingName, setCreatingName] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPrefill, setModalPrefill] = useState<SuggestedShelf | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [profile, books] = await Promise.all([
        getProfile(userId),
        getUserLibraryBooks(userId),
      ]);
      const next = await getSuggestedShelves(userId, profile?.favorite_genres, books);
      setSuggestions(next);
    } catch (error) {
      console.error("[suggested-shelves] load failed:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleQuickCreate(shelf: SuggestedShelf) {
    setCreatingName(shelf.name);
    const result = await createCustomShelf(userId, {
      name: shelf.name,
      genre: shelf.genre,
    });
    setCreatingName(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.shelf) {
      toast.success(`Created "${result.shelf.name}"`);
      onShelfCreated?.(result.shelf);
      void refresh();
    }
  }

  function openCustomize(shelf: SuggestedShelf) {
    setModalPrefill(shelf);
    setModalOpen(true);
  }

  if (loading) {
    return (
      <section className={cn("text-center text-sm text-text-muted", className)}>
        Loading shelf ideas…
      </section>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <section className={cn("rounded-xl border border-border bg-surface p-5 shadow-sm", className)}>
      <div className="mb-4 text-center">
        <h2 className="text-lg font-semibold text-puce-red">Suggested shelves</h2>
        <p className="mt-1 text-sm text-text-muted">
          One-tap collections based on your genres and reading history.
        </p>
      </div>

      <ul className="flex flex-wrap justify-center gap-2">
        {suggestions.map((shelf) => (
          <li key={shelf.name}>
            <div className="flex overflow-hidden rounded-lg border border-border bg-background shadow-sm">
              <button
                type="button"
                disabled={creatingName === shelf.name}
                onClick={() => void handleQuickCreate(shelf)}
                className="min-h-[44px] px-3 py-2 text-left text-sm transition hover:bg-primary/5 disabled:opacity-50"
              >
                <span className="block font-medium text-text">📚 {shelf.name}</span>
                <span className="block text-xs text-text-muted">
                  {shelf.genre ?? shelf.reason}
                </span>
              </button>
              <button
                type="button"
                onClick={() => openCustomize(shelf)}
                className="border-l border-border px-2 text-xs text-text-muted hover:bg-background hover:text-text"
                aria-label={`Customize ${shelf.name} shelf before creating`}
              >
                ✎
              </button>
            </div>
          </li>
        ))}
      </ul>

      <CreateShelfModal
        open={modalOpen}
        userId={userId}
        initialName={modalPrefill?.name ?? ""}
        initialGenre={modalPrefill?.genre ?? ""}
        onClose={() => {
          setModalOpen(false);
          setModalPrefill(null);
        }}
        onCreated={(shelf) => {
          onShelfCreated?.(shelf);
          void refresh();
        }}
      />
    </section>
  );
}
