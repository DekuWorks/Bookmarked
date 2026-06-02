import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/services/profile";
import { getUserLibraryBooks, groupBooksByShelf } from "@/lib/services/library";
import { LibraryViewShell } from "@/components/library/LibraryViewShell";
import { Button } from "@/components/ui/Button";
import type { LibraryViewMode } from "@/types";

export const metadata = { title: "Library" };

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const profile = await getProfile(user.id);
  const books = await getUserLibraryBooks(user.id);
  const shelves = groupBooksByShelf(books);
  const isEmpty = books.length === 0;

  const rawView = profile?.preferred_library_view ?? "bookshelf";
  const preferredView: LibraryViewMode =
    rawView === "reading_room" ? "bookshelf" : rawView;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-puce-red">Library</h1>
          <p className="mt-1 text-text-muted">
            Your digital home library — browse shelves, track progress, and explore your collection.
          </p>
        </div>
        <Link href="/search" className="inline-flex">
          <Button variant="secondary" type="button">
            Add books
          </Button>
        </Link>
      </header>

      {isEmpty ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="text-lg font-medium text-text">Your library is empty</p>
          <p className="mt-2 text-text-muted">Search for books to add them to a shelf.</p>
          <Link href="/search" className="mt-6 inline-flex">
            <Button variant="primary" type="button">
              Search books
            </Button>
          </Link>
        </div>
      ) : (
        <LibraryViewShell initialView={preferredView} shelves={shelves} />
      )}
    </div>
  );
}
