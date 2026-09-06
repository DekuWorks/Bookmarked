"use client";

import { useCallback, useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { CreateShelfButton } from "@/components/shelves/CreateShelfButton";
import { CustomShelvesView } from "@/components/library/CustomShelvesView";
import { useToast } from "@/components/ui/Toast";
import {
  getCustomShelfGroupsWithBooks,
  type CustomShelfGroup,
} from "@/lib/services/customShelves";
import { customShelfPath } from "@/lib/routes/customShelf";
import type { UserShelf } from "@/types";

type Props = {
  userId: string;
  title?: string;
  description?: string;
  showQuickLinks?: boolean;
  className?: string;
};

export function CustomShelfCollectionsPanel({
  userId,
  title = "Your collections",
  description = "Create named shelves to organize books by theme, genre, or mood.",
  showQuickLinks = true,
  className,
}: Props) {
  const toast = useToast();
  const [shelves, setShelves] = useState<CustomShelfGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const groups = await getCustomShelfGroupsWithBooks(userId);
      setShelves(groups);
    } catch (error) {
      console.error("[custom-shelves] load failed:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function handleCreated(shelf: UserShelf) {
    setShelves((prev) => [
      ...prev,
      {
        id: shelf.id,
        name: shelf.name,
        slug: shelf.slug,
        genre: shelf.genre,
        visibility: shelf.visibility,
        icon_key: shelf.icon_key,
        items: [],
      },
    ]);
  }

  function handleShelfDeleted(shelfId: string) {
    setShelves((prev) => prev.filter((shelf) => shelf.id !== shelfId));
    toast.success("Shelf deleted.");
  }

  function handleShelfUpdated(shelf: UserShelf) {
    setShelves((prev) =>
      prev.map((entry) =>
        entry.id === shelf.id
          ? {
              ...entry,
              name: shelf.name,
              slug: shelf.slug,
              genre: shelf.genre,
              visibility: shelf.visibility,
              icon_key: shelf.icon_key,
            }
          : entry
      )
    );
    toast.success("Shelf updated.");
  }

  return (
    <section className={className}>
      <div className="mb-4 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <h2 className="text-xl font-semibold text-puce-red">{title}</h2>
          <p className="mt-1 text-sm text-text-muted">{description}</p>
        </div>
        <CreateShelfButton userId={userId} onCreated={handleCreated} variant="secondary" />
      </div>

      {loading ? (
        <p className="text-center text-sm text-text-muted">Loading collections…</p>
      ) : shelves.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-8 text-center">
          <p className="text-sm text-text-muted">
            No custom shelves yet. Create one to group books however you like.
          </p>
        </div>
      ) : (
        <>
          <CustomShelvesView
            shelves={shelves}
            onShelfDeleted={handleShelfDeleted}
            onShelfUpdated={handleShelfUpdated}
          />
          {showQuickLinks ? (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {shelves.map((shelf) => (
                <ButtonLink
                  key={shelf.id}
                  href={customShelfPath(shelf.slug)}
                  variant="outline"
                  size="sm"
                >
                  {shelf.name}
                </ButtonLink>
              ))}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
