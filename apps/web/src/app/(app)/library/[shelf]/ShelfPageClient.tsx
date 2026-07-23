"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getShelfConfigBySlug } from "@/lib/constants/shelves";
import { ShelfIcon } from "@/components/shelves/ShelfIcon";
import { getProfile } from "@/lib/services/profile";
import {
  computeShelfStats,
  getUserLibraryBooks,
  groupBooksByShelf,
} from "@/lib/services/library";
import { ShelfStatsPanel } from "@/components/library/ShelfStatsPanel";
import { ShelfSearchFilter } from "@/components/library/ShelfSearchFilter";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { LoadingState } from "@/components/ui/LoadingState";
import { layout } from "@/lib/constants/layout";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import type { LibraryViewMode } from "@/types";
import type { ShelfGroup } from "@/lib/services/library";

export default function ShelfPageClient() {
  const params = useParams<{ shelf: string }>();
  const user = useAuthUser();
  const config = getShelfConfigBySlug(params.shelf);
  const [shelfGroup, setShelfGroup] = useState<ShelfGroup | null>(null);
  const [stats, setStats] = useState<ReturnType<typeof computeShelfStats> | null>(null);
  const [preferredView, setPreferredView] = useState<LibraryViewMode>("bookshelf");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (user === undefined) return;
    if (!user || !config) return;

    setLoadError(null);
    void Promise.all([getProfile(user.id), getUserLibraryBooks(user.id)])
      .then(([profile, books]) => {
        const allShelves = groupBooksByShelf(books);
        const group = allShelves.find((s) => s.status === config.status)!;
        setShelfGroup(group);
        setStats(computeShelfStats(books, config.status));
        const rawView = profile?.preferred_library_view ?? "bookshelf";
        setPreferredView(rawView === "reading_room" ? "bookshelf" : rawView);
      })
      .catch((error) => {
        console.error("[shelf] failed to load:", error);
        setLoadError("Could not load this shelf. Please refresh and try again.");
      });
  }, [user, config]);

  if (!config) {
    return (
      <div className="text-center">
        <p className="text-text-muted">Shelf not found.</p>
        <Link href="/library" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Back to library
        </Link>
      </div>
    );
  }

  if (user === undefined || (user && !shelfGroup && !loadError)) {
    return <LoadingState message="Loading shelf…" />;
  }

  if (loadError) {
    return (
      <div className="text-center">
        <p className="text-rust">{loadError}</p>
        <Link href="/library" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Back to library
        </Link>
      </div>
    );
  }

  if (!user || !stats || !shelfGroup) return null;

  return (
    <div className={layout.pageStackWide}>
      <header className="flex flex-col items-center gap-4 text-center">
        <div>
          <Link
            href="/library"
            className="inline-block text-sm font-medium text-primary hover:underline"
          >
            ← Back to library
          </Link>
          <h1 className="mt-2 flex items-center justify-center gap-2 text-3xl font-bold text-puce-red sm:text-4xl">
            <ShelfIcon id={config.status} size="large" labeled />
            {config.title}
          </h1>
          <p className="mx-auto mt-1 max-w-xl text-pretty text-text-muted">{config.description}</p>
          <p className="mt-2 text-sm font-medium text-text">
            {stats.totalBooks} {stats.totalBooks === 1 ? "book" : "books"}
          </p>
        </div>
        <ButtonLink href="/search" variant="secondary">
          Add books
        </ButtonLink>
      </header>

      <ShelfStatsPanel stats={stats} status={config.status} />

      <ShelfSearchFilter shelf={shelfGroup} initialView={preferredView} />
    </div>
  );
}
