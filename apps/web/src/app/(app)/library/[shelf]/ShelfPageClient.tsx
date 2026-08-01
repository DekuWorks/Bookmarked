"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getShelfConfigBySlug } from "@/lib/constants/shelves";
import { ShelfTitleRow } from "@/components/shelves/ShelfTitleRow";
import { getProfile } from "@/lib/services/profile";
import {
  clearBuiltInShelf,
  computeShelfStats,
  getUserLibraryBooks,
  groupBooksByShelf,
} from "@/lib/services/library";
import { ShelfStatsPanel } from "@/components/library/ShelfStatsPanel";
import { ShelfSearchFilter } from "@/components/library/ShelfSearchFilter";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { layout } from "@/lib/constants/layout";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import type { LibraryViewMode } from "@/types";
import type { ShelfGroup } from "@/lib/services/library";

export default function ShelfPageClient() {
  const params = useParams<{ shelf: string }>();
  const user = useAuthUser();
  const toast = useToast();
  const config = getShelfConfigBySlug(params.shelf);
  const [shelfGroup, setShelfGroup] = useState<ShelfGroup | null>(null);
  const [stats, setStats] = useState<ReturnType<typeof computeShelfStats> | null>(null);
  const [preferredView, setPreferredView] = useState<LibraryViewMode>("bookshelf");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

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

  async function handleClear() {
    if (!user || !config || !shelfGroup) return;
    setClearing(true);
    const result = await clearBuiltInShelf(user.id, config.status);
    setClearing(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setShelfGroup((current) => (current ? { ...current, items: [] } : current));
    setStats(computeShelfStats([], config.status));
    setClearOpen(false);
    toast.success(`Cleared ${config.title}. Books remain in your library and other shelves.`);
  }

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
          <h1 className="mt-2 flex justify-center">
            <ShelfTitleRow
              id={config.status}
              title={config.title}
              size="large"
              titleClassName="font-display text-3xl font-bold tracking-tight text-puce-red sm:text-4xl"
            />
          </h1>
          <p className="mx-auto mt-1 max-w-xl text-pretty text-text-muted">{config.description}</p>
          <p className="mt-2 text-sm font-medium text-text">
            {stats.totalBooks} {stats.totalBooks === 1 ? "book" : "books"}
          </p>
        </div>
        <ButtonLink href="/search" variant="secondary">
          Add books
        </ButtonLink>
        {shelfGroup.items.length > 0 ? (
          <Button type="button" variant="outline" onClick={() => setClearOpen(true)}>
            Clear shelf
          </Button>
        ) : null}
      </header>

      <Modal
        open={clearOpen}
        onClose={() => !clearing && setClearOpen(false)}
        title={`Clear ${config.title}?`}
      >
        <p className="mb-4 text-sm text-text-muted">
          This removes every book from {config.title} only. Your books and any other shelf
          associations stay intact.
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" disabled={clearing} onClick={() => setClearOpen(false)}>
            Cancel
          </Button>
          <Button type="button" loading={clearing} onClick={() => void handleClear()}>
            Clear shelf
          </Button>
        </div>
      </Modal>

      <ShelfStatsPanel stats={stats} status={config.status} />

      <ShelfSearchFilter shelf={shelfGroup} initialView={preferredView} />
    </div>
  );
}
