"use client";

import { useEffect, useState } from "react";
import { getProfile } from "@/lib/services/profile";
import { getUserLibraryBooks, groupBooksByShelf } from "@/lib/services/library";
import { LibraryViewShell } from "@/components/library/LibraryViewShell";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { LibraryAnalyticsPanel } from "@/components/library/LibraryAnalyticsPanel";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
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

  useEffect(() => {
    if (!user) return;
    void Promise.all([getProfile(user.id), getUserLibraryBooks(user.id)]).then(
      ([profile, books]) => {
        const rawView = profile?.preferred_library_view ?? "bookshelf";
        const preferredView: LibraryViewMode =
          rawView === "reading_room" ? "bookshelf" : rawView;
        setData({
          books,
          shelves: groupBooksByShelf(books),
          preferredView,
          userId: user.id,
        });
      }
    );
  }, [user]);

  if (user === undefined || (user && !data)) {
    return <LoadingState message="Loading library…" />;
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

      {!isEmpty ? (
        <LibraryAnalyticsPanel books={books} userId={userId} showFuturePlaceholders />
      ) : null}

      {isEmpty ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="text-lg font-medium text-text">Your library is empty</p>
          <p className="mt-2 text-text-muted">Search for books to add them to a shelf.</p>
          <ButtonLink href="/search" variant="primary" className="mt-6">
            Search books
          </ButtonLink>
        </div>
      ) : (
        <LibraryViewShell initialView={preferredView} shelves={shelves} />
      )}
    </div>
  );
}
