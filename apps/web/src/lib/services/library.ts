import { createClient } from "@/lib/supabase/server";
import { SHELF_CONFIG } from "@/lib/constants/shelves";
import type { ShelfStatus } from "@/types";

export type LibraryBookRow = {
  id: string;
  shelf_status: ShelfStatus;
  progress_percent: number;
  progress_pages: number;
  rating: number | null;
  is_favorite: boolean;
  finished_at: string | null;
  started_at: string | null;
  updated_at: string;
  books: {
    id: string;
    title: string;
    author: string | null;
    cover_url: string | null;
    page_count: number | null;
  } | null;
};

export type ShelfGroup = {
  status: ShelfStatus;
  title: string;
  slug: string;
  emoji: string;
  items: LibraryBookRow[];
};

const LIBRARY_SELECT =
  "id, shelf_status, progress_percent, progress_pages, rating, is_favorite, finished_at, started_at, updated_at, books(id, title, author, cover_url, page_count)";

export async function getUserLibraryBooks(userId: string): Promise<LibraryBookRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_books")
    .select(LIBRARY_SELECT)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as LibraryBookRow[];
}

export function groupBooksByShelf(books: LibraryBookRow[]): ShelfGroup[] {
  return SHELF_CONFIG.map((shelf) => ({
    status: shelf.status,
    title: shelf.title,
    slug: shelf.slug,
    emoji: shelf.emoji,
    items: books.filter((b) => b.shelf_status === shelf.status),
  }));
}

export type ShelfStats = {
  totalBooks: number;
  averageProgress: number;
  averageRating: number | null;
  pagesRead: number;
  finishedThisMonth: number;
};

export function computeShelfStats(books: LibraryBookRow[], status: ShelfStatus): ShelfStats {
  const items = books.filter((b) => b.shelf_status === status);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const withProgress = items.filter((b) => Number(b.progress_percent) > 0);
  const averageProgress =
    withProgress.length > 0
      ? withProgress.reduce((sum, b) => sum + Number(b.progress_percent), 0) / withProgress.length
      : 0;

  const rated = items.filter((b) => b.rating != null);
  const averageRating =
    rated.length > 0
      ? rated.reduce((sum, b) => sum + Number(b.rating), 0) / rated.length
      : null;

  const pagesRead = items.reduce((sum, b) => sum + (Number(b.progress_pages) || 0), 0);

  const finishedThisMonth =
    status === "read"
      ? items.filter((b) => b.finished_at && new Date(b.finished_at) >= monthStart).length
      : 0;

  return {
    totalBooks: items.length,
    averageProgress,
    averageRating,
    pagesRead,
    finishedThisMonth,
  };
}
