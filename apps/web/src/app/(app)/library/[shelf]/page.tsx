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
import { ShelfViewShell } from "@/components/library/LibraryViewShell";
import { Button } from "@/components/ui/Button";
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

  const preferredView: LibraryViewMode =
    profile?.preferred_library_view ?? "bookshelf";

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
        </div>
        <Link href="/search" className="inline-flex">
          <Button variant="secondary" type="button">
            Add books
          </Button>
        </Link>
      </header>

      <ShelfStatsPanel stats={stats} status={config.status} />

      <ShelfViewShell initialView={preferredView} shelves={[shelfGroup]} />
    </div>
  );
}
