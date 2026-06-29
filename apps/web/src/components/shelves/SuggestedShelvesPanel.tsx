"use client";

import { useCallback, useEffect, useState } from "react";
import { CreateShelfModal } from "@/components/shelves/CreateShelfModal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  createCustomShelf,
  validateCustomShelfInput,
} from "@/lib/services/customShelves";
import {
  getSuggestedShelves,
  matchingLibraryBookIds,
  type SuggestedShelf,
} from "@/lib/services/suggestedShelves";
import { getUserLibraryBooks, type LibraryBookRow } from "@/lib/services/library";
import { getProfile } from "@/lib/services/profile";
import { useUserBooksRealtime } from "@/lib/hooks/useUserBooksRealtime";
import { useToast } from "@/components/ui/Toast";
import type { UserShelf } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  userId: string;
  className?: string;
  onShelfCreated?: (shelf: UserShelf) => void;
};

type ShelfDraft = {
  name: string;
  genre: string;
};

function suggestionKey(shelf: SuggestedShelf): string {
  return `${shelf.name}::${shelf.reason}`;
}

function draftFromShelf(shelf: SuggestedShelf): ShelfDraft {
  return {
    name: shelf.name,
    genre: shelf.genre ?? "",
  };
}

function suggestionSubtitle(shelf: SuggestedShelf): string {
  const parts: string[] = [];
  if (shelf.genre) parts.push(shelf.genre);
  else parts.push(shelf.reason);
  if (shelf.matchCount > 0) {
    parts.push(
      `${shelf.matchCount} book${shelf.matchCount === 1 ? "" : "s"} match`
    );
  }
  return parts.join(" · ");
}

export function SuggestedShelvesPanel({ userId, className, onShelfCreated }: Props) {
  const toast = useToast();
  const [suggestions, setSuggestions] = useState<SuggestedShelf[]>([]);
  const [libraryBooks, setLibraryBooks] = useState<LibraryBookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingKey, setCreatingKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ShelfDraft>>({});
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPrefill, setModalPrefill] = useState<SuggestedShelf | null>(null);
  const [modalBookIds, setModalBookIds] = useState<string[]>([]);

  const reloadSuggestions = useCallback(async () => {
    const [profile, books] = await Promise.all([
      getProfile(userId),
      getUserLibraryBooks(userId),
    ]);
    const next = await getSuggestedShelves(userId, profile?.favorite_genres, books);
    setSuggestions(next);
    setLibraryBooks(books);
  }, [userId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await reloadSuggestions();
    } catch (error) {
      console.error("[suggested-shelves] load failed:", error);
    } finally {
      setLoading(false);
    }
  }, [reloadSuggestions]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useUserBooksRealtime(userId, () => {
    void reloadSuggestions();
  });

  function removeSuggestion(key: string) {
    setSuggestions((prev) => prev.filter((shelf) => suggestionKey(shelf) !== key));
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (editingKey === key) {
      setEditingKey(null);
      setInlineError(null);
    }
  }

  async function createFromDraft(key: string, draft: ShelfDraft) {
    const validated = validateCustomShelfInput({
      name: draft.name,
      genre: draft.genre || null,
    });
    if (!validated.ok) {
      setInlineError(validated.error);
      return null;
    }

    setInlineError(null);
    setCreatingKey(key);

    const bookIds = matchingLibraryBookIds(libraryBooks, validated.value.genre);
    const result = await createCustomShelf(userId, validated.value, { bookIds });
    setCreatingKey(null);

    if (result.error) {
      toast.error(result.error);
      return null;
    }

    if (result.shelf) {
      const addedNote =
        result.booksAdded && result.booksAdded > 0
          ? ` with ${result.booksAdded} matching book${result.booksAdded === 1 ? "" : "s"}`
          : "";
      toast.success(`Created "${result.shelf.name}"${addedNote}`);
      onShelfCreated?.(result.shelf);
      removeSuggestion(key);
      void reloadSuggestions();
      return result.shelf;
    }

    return null;
  }

  async function handleQuickCreate(shelf: SuggestedShelf) {
    const key = suggestionKey(shelf);
    await createFromDraft(key, draftFromShelf(shelf));
  }

  function startInlineEdit(shelf: SuggestedShelf) {
    const key = suggestionKey(shelf);
    setEditingKey(key);
    setInlineError(null);
    setDrafts((prev) => ({
      ...prev,
      [key]: prev[key] ?? draftFromShelf(shelf),
    }));
  }

  function cancelInlineEdit(key: string) {
    setEditingKey(null);
    setInlineError(null);
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function updateDraft(key: string, patch: Partial<ShelfDraft>) {
    setDrafts((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
    setInlineError(null);
  }

  function openCustomizeModal(shelf: SuggestedShelf, genreOverride?: string | null) {
    const genre = genreOverride ?? shelf.genre;
    setModalPrefill({ ...shelf, genre });
    setModalBookIds(matchingLibraryBookIds(libraryBooks, genre));
    setModalOpen(true);
    setEditingKey(null);
    setInlineError(null);
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
        {suggestions.map((shelf) => {
          const key = suggestionKey(shelf);
          const isEditing = editingKey === key;
          const draft = drafts[key] ?? draftFromShelf(shelf);
          const isCreating = creatingKey === key;

          if (isEditing) {
            return (
              <li key={key} className="w-full max-w-sm">
                <div className="rounded-lg border border-border bg-background p-3 shadow-sm">
                  <Input
                    label="Shelf name"
                    value={draft.name}
                    onChange={(e) => updateDraft(key, { name: e.target.value })}
                    maxLength={80}
                    required
                    autoFocus
                    className="mb-2"
                  />
                  <Input
                    label="Genre (optional)"
                    value={draft.genre}
                    onChange={(e) => updateDraft(key, { genre: e.target.value })}
                    maxLength={80}
                    className="mb-2"
                  />
                  {inlineError ? (
                    <p className="mb-2 text-sm text-rust" role="alert">
                      {inlineError}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isCreating}
                      onClick={() => cancelInlineEdit(key)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isCreating}
                      onClick={() =>
                        openCustomizeModal(
                          {
                            ...shelf,
                            name: draft.name,
                            genre: draft.genre.trim() || null,
                          },
                          draft.genre.trim() || null
                        )
                      }
                    >
                      Full editor
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      loading={isCreating}
                      onClick={() => void createFromDraft(key, draft)}
                    >
                      Create shelf
                    </Button>
                  </div>
                </div>
              </li>
            );
          }

          return (
            <li key={key}>
              <div className="flex overflow-hidden rounded-lg border border-border bg-background shadow-sm">
                <button
                  type="button"
                  disabled={isCreating}
                  onClick={() => void handleQuickCreate(shelf)}
                  className="min-h-[44px] px-3 py-2 text-left text-sm transition hover:bg-primary/5 disabled:opacity-50"
                >
                  <span className="block font-medium text-text">📚 {shelf.name}</span>
                  <span className="block text-xs text-text-muted">
                    {suggestionSubtitle(shelf)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => startInlineEdit(shelf)}
                  className="border-l border-border px-2 text-xs text-text-muted hover:bg-background hover:text-text"
                  aria-label={`Customize ${shelf.name} shelf before creating`}
                  title="Customize before creating"
                >
                  ✎
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <CreateShelfModal
        key={modalPrefill ? suggestionKey(modalPrefill) : "new-shelf"}
        open={modalOpen}
        userId={userId}
        initialName={modalPrefill?.name ?? ""}
        initialGenre={modalPrefill?.genre ?? ""}
        matchingBookIds={modalBookIds}
        onClose={() => {
          setModalOpen(false);
          setModalPrefill(null);
          setModalBookIds([]);
        }}
        onCreated={(shelf, booksAdded) => {
          const addedNote =
            booksAdded && booksAdded > 0
              ? ` with ${booksAdded} matching book${booksAdded === 1 ? "" : "s"}`
              : "";
          toast.success(`Created "${shelf.name}"${addedNote}`);
          onShelfCreated?.(shelf);
          if (modalPrefill) {
            removeSuggestion(suggestionKey(modalPrefill));
          }
          setModalOpen(false);
          setModalPrefill(null);
          setModalBookIds([]);
          void reloadSuggestions();
        }}
      />
    </section>
  );
}
