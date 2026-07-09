"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { getProfile } from "@/lib/services/profile";
import { getUserLibraryBooks, groupBooksByShelf } from "@/lib/services/library";
import { LibraryOrganizePanel } from "@/components/library/LibraryOrganizePanel";
import { CustomShelfCollectionsPanel } from "@/components/library/CustomShelfCollectionsPanel";
import { SuggestedShelvesPanel } from "@/components/shelves/SuggestedShelvesPanel";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useUserBooksRealtime } from "@/lib/hooks/useUserBooksRealtime";
import { useStaleCatalogRefresh } from "@/lib/hooks/useStaleCatalogRefresh";
import type { LibraryViewMode } from "@/types";
import type { LibraryBookRow, ShelfGroup } from "@/lib/services/library";

type LibraryData = {
  books: LibraryBookRow[];
  shelves: ShelfGroup[];
  preferredView: LibraryViewMode;
  userId: string;
};

import { layout } from "@/lib/constants/layout";

export default function LibraryPage() {
  const user = useAuthUser();
  const [data, setData] = useState<LibraryData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadLibrary = useCallback(async () => {
    if (!user) return;

    setLoadError(null);
    try {
      const [profile, books] = await Promise.all([
        getProfile(user.id),
        getUserLibraryBooks(user.id),
      ]);
      const rawView = profile?.preferred_library_view ?? "bookshelf";
      const preferredView: LibraryViewMode =
        rawView === "reading_room" ? "bookshelf" : rawView;
      setData({
        books,
        shelves: groupBooksByShelf(books),
        preferredView,
        userId: user.id,
      });
    } catch (error) {
      console.error("[library] failed to load:", error);
      setLoadError("Could not load your library. Please refresh and try again.");
    }
  }, [user]);

  useEffect(() => {
    if (user === undefined) return;

    if (!user) {
      setData(null);
      setLoadError(null);
      return;
    }

    setData(null);
    void loadLibrary();
  }, [user, loadLibrary]);

  useUserBooksRealtime(user?.id, loadLibrary);
  useStaleCatalogRefresh(data?.books, loadLibrary);

  if (user === undefined || (user && !data && !loadError)) {
    return <LoadingState message="Loading library…" />;
  }

  if (loadError) {
    return (
      <div className={`${layout.pageStackWide} text-center`}>
        <p className="text-rust">{loadError}</p>
      </div>
    );
  }

  if (!user || !data) return null;

  const { books, shelves, preferredView, userId } = data;
  const isEmpty = books.length === 0;

  return (
    <div className={layout.pageStackWide}>
      <header className="flex flex-col items-center gap-4 text-center">
        <div>
          <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">Library</h1>
          <p className="mx-auto mt-1 max-w-2xl text-pretty text-text-muted">
            Your digital home library — browse shelves, track progress, and explore your collection.
          </p>
        </div>
        <ButtonLink href="/search" variant="secondary">
          Add books
        </ButtonLink>
      </header>

      {isEmpty ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="text-lg font-medium text-text">Your library is empty</p>
          <p className="mt-2 text-text-muted">Search for books to add them to a shelf.</p>
          <ButtonLink href="/search" variant="primary" className="mt-6">
            Search books
          </ButtonLink>
        </div>
      ) : (
        <Suspense fallback={<LoadingState message="Loading view…" />}>
          <LibraryOrganizePanel initialView={preferredView} shelves={shelves} />
        </Suspense>
      )}

      <SuggestedShelvesPanel userId={userId} className="pt-2" />

      <CustomShelfCollectionsPanel userId={userId} className="pt-4" />
    </div>
  );
}
