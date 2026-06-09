"use client";

import { useState, useTransition } from "react";
import { BookshelfView } from "@/components/library/BookshelfView";
import { LibraryGridView } from "@/components/library/LibraryGridView";
import { updatePreferredLibraryView } from "@/lib/actions/library";
import type { ShelfGroup } from "@/lib/services/library";
import type { LibraryViewMode } from "@/types";
import { cn } from "@/lib/utils/cn";

type DisplayViewMode = "bookshelf" | "grid";

type Props = {
  initialView: LibraryViewMode;
  shelves: ShelfGroup[];
};

const VIEW_OPTIONS: { mode: DisplayViewMode; label: string }[] = [
  { mode: "bookshelf", label: "Bookshelf View" },
  { mode: "grid", label: "Grid View" },
];

function normalizeView(view: LibraryViewMode): DisplayViewMode {
  return view === "grid" ? "grid" : "bookshelf";
}

export function LibraryViewShell({ initialView, shelves }: Props) {
  const [view, setView] = useState<DisplayViewMode>(normalizeView(initialView));
  const [pending, startTransition] = useTransition();

  function handleViewChange(mode: DisplayViewMode) {
    setView(mode);
    startTransition(() => {
      updatePreferredLibraryView(mode);
    });
  }

  return (
    <div className="space-y-8">
      <div
        className="flex w-full max-w-full rounded-lg border border-border bg-surface p-1 shadow-sm sm:inline-flex sm:w-auto"
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
              "min-h-[44px] flex-1 rounded-md px-3 py-2 text-sm font-medium transition sm:flex-none sm:py-1.5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange focus-visible:ring-offset-1",
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
  const [view, setView] = useState<DisplayViewMode>(normalizeView(initialView));
  const [pending, startTransition] = useTransition();
  const shelf = shelves[0];

  function handleViewChange(mode: DisplayViewMode) {
    setView(mode);
    startTransition(() => {
      updatePreferredLibraryView(mode);
    });
  }

  return (
    <div className="space-y-8">
      <div
        className="flex w-full max-w-full rounded-lg border border-border bg-surface p-1 shadow-sm sm:inline-flex sm:w-auto"
        role="tablist"
        aria-label="Shelf view mode"
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
              "min-h-[44px] flex-1 rounded-md px-3 py-2 text-sm font-medium transition sm:flex-none sm:py-1.5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange focus-visible:ring-offset-1",
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
