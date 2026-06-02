"use client";

import { useState, useTransition } from "react";
import { BookshelfView } from "@/components/library/BookshelfView";
import { LibraryGridView } from "@/components/library/LibraryGridView";
import { ReadingRoom } from "@/components/library/ReadingRoom";
import { updatePreferredLibraryView } from "@/lib/actions/library";
import type { LibraryAnalytics, LibraryBookRow, ShelfGroup } from "@/lib/services/library";
import type { LibraryViewMode } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  displayName: string | null;
  username: string | null;
  initialView: LibraryViewMode;
  shelves: ShelfGroup[];
  analytics: LibraryAnalytics;
  allBooks: LibraryBookRow[];
};

const VIEW_OPTIONS: { mode: LibraryViewMode; label: string }[] = [
  { mode: "reading_room", label: "Reading Room" },
  { mode: "bookshelf", label: "Bookshelf" },
  { mode: "grid", label: "Grid" },
];

export function LibraryViewShell({
  displayName,
  username,
  initialView,
  shelves,
  analytics,
  allBooks,
}: Props) {
  const [view, setView] = useState<LibraryViewMode>(initialView);
  const [pending, startTransition] = useTransition();

  function handleViewChange(mode: LibraryViewMode) {
    setView(mode);
    startTransition(() => {
      updatePreferredLibraryView(mode);
    });
  }

  return (
    <div className="space-y-8">
      <div
        className="inline-flex rounded-lg border border-border bg-surface p-1 shadow-sm"
        role="tablist"
        aria-label="Library view mode"
      >
        {VIEW_OPTIONS.map(({ mode, label }) => (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={view === mode}
            disabled={pending}
            onClick={() => handleViewChange(mode)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition",
              view === mode
                ? "bg-puce-red text-white shadow-sm"
                : "text-text-muted hover:bg-background hover:text-text"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "reading_room" ? (
        <ReadingRoom
          displayName={displayName}
          username={username}
          shelves={shelves}
          analytics={analytics}
          allBooks={allBooks}
        />
      ) : view === "bookshelf" ? (
        <BookshelfView shelves={shelves} />
      ) : (
        <LibraryGridView shelves={shelves} />
      )}
    </div>
  );
}

export function ShelfViewShell({
  initialView,
  shelves,
}: {
  initialView: LibraryViewMode;
  shelves: ShelfGroup[];
}) {
  const [view, setView] = useState<LibraryViewMode>(
    initialView === "reading_room" ? "bookshelf" : initialView
  );
  const [pending, startTransition] = useTransition();
  const shelf = shelves[0];

  function handleViewChange(mode: LibraryViewMode) {
    if (mode === "reading_room") return;
    setView(mode);
    startTransition(() => {
      updatePreferredLibraryView(mode);
    });
  }

  const shelfOptions = VIEW_OPTIONS.filter((o) => o.mode !== "reading_room");

  return (
    <div className="space-y-8">
      <div
        className="inline-flex rounded-lg border border-border bg-surface p-1 shadow-sm"
        role="tablist"
        aria-label="Shelf view mode"
      >
        {shelfOptions.map(({ mode, label }) => (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={view === mode}
            disabled={pending}
            onClick={() => handleViewChange(mode)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition",
              view === mode
                ? "bg-puce-red text-white shadow-sm"
                : "text-text-muted hover:bg-background hover:text-text"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "bookshelf" ? (
        <BookshelfView shelves={shelf ? [shelf] : []} />
      ) : (
        <LibraryGridView shelves={shelf ? [shelf] : []} />
      )}
    </div>
  );
}
