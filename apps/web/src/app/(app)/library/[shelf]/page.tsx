import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getShelfConfigBySlug } from "@/lib/constants/shelves";
import { getProfile } from "@/lib/services/profile";
import {
  computeShelfStats,
  getUserLibraryBooks,
  groupBooksByShelf,
} from "@/lib/services/library";
import { ShelfStatsPanel } from "@/components/library/ShelfStatsPanel";
import { ShelfSearchFilter } from "@/components/library/ShelfSearchFilter";
import { ButtonLink } from "@/components/ui/ButtonLink";
import type { LibraryViewMode } from "@/types";

type Props = {
  params: Promise<{ shelf: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { shelf: slug } = await params;
  const config = getShelfConfigBySlug(slug);
  return { title: config ? `${config.title} · Library` : "Shelf" };
}

export default async function ShelfPage({ params }: Props) {
  const { shelf: slug } = await params;
  const config = getShelfConfigBySlug(slug);

  if (!config) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const profile = await getProfile(user.id);
  const books = await getUserLibraryBooks(user.id);
  const allShelves = groupBooksByShelf(books);
  const shelfGroup = allShelves.find((s) => s.status === config.status)!;
  const stats = computeShelfStats(books, config.status);

  const rawView = profile?.preferred_library_view ?? "bookshelf";
  const preferredView: LibraryViewMode =
    rawView === "reading_room" ? "bookshelf" : rawView;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/library"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Back to library
          </Link>
          <h1 className="mt-2 flex items-center gap-2 text-3xl font-bold text-puce-red">
            <span aria-hidden>{config.emoji}</span>
            {config.title}
          </h1>
          <p className="mt-1 text-text-muted">{config.description}</p>
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
