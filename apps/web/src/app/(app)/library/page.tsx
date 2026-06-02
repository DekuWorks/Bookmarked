import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/services/profile";
import {
  computeLibraryAnalytics,
  getUserLibraryBooks,
  groupBooksByShelf,
} from "@/lib/services/library";
import { LibraryAnalyticsPanel } from "@/components/library/LibraryAnalytics";
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
  const analytics = computeLibraryAnalytics(books);
  const isEmpty = books.length === 0;

  const preferredView: LibraryViewMode =
    profile?.preferred_library_view ?? "bookshelf";

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

      {!isEmpty ? <LibraryAnalyticsPanel analytics={analytics} /> : null}

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
        <LibraryViewShell
          displayName={profile?.display_name ?? null}
          username={profile?.username ?? null}
          initialView={preferredView}
          shelves={shelves}
          analytics={analytics}
          allBooks={books}
        />
      )}
    </div>
  );
}
