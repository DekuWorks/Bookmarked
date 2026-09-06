import { createClient } from "@/lib/supabase/client";
import {
  groupBooksByShelf,
  type LibraryBookRow,
  type ShelfGroup,
} from "@/lib/services/library";
import { filterPublicLibraryBooks } from "@bookmarked/utils/publicLibraryVisibility";
import type { Profile } from "@/types";

const LIBRARY_SELECT =
  "id, shelf_status, progress_percent, progress_pages, rating, is_favorite, finished_at, started_at, created_at, updated_at, books(id, title, author, cover_url, page_count, subjects)";

export async function getReaderLibraryBooks(
  ownerId: string
): Promise<LibraryBookRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_books")
    .select(LIBRARY_SELECT)
    .eq("user_id", ownerId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as LibraryBookRow[];
}

export function buildShelfPreview(
  books: LibraryBookRow[],
  limitPerShelf = 4
): ShelfGroup[] {
  return groupBooksByShelf(books).map((shelf) => ({
    ...shelf,
    items: shelf.items.slice(0, limitPerShelf),
  }));
}

export function buildFullShelves(books: LibraryBookRow[]): ShelfGroup[] {
  return groupBooksByShelf(books);
}

export function filterReaderLibraryBooks(
  books: LibraryBookRow[],
  profile: Profile,
  viewerId: string | null | undefined,
  viewerFollowsOwner: boolean
): LibraryBookRow[] {
  return filterPublicLibraryBooks(books, {
    ownerId: profile.id,
    viewerId,
    viewerFollowsOwner,
    profile,
  });
}
