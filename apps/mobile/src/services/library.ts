import { supabase } from "./supabase";
import { SHELF_CONFIG } from "../constants/shelves";
import type { ShelfStatus } from "../types";

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
  created_at: string;
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
  emoji: string;
  items: LibraryBookRow[];
};

const LIBRARY_SELECT =
  "id, shelf_status, progress_percent, progress_pages, rating, is_favorite, finished_at, started_at, created_at, updated_at, books(id, title, author, cover_url, page_count)";

export async function getUserLibraryBooks(userId: string): Promise<LibraryBookRow[]> {
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
    emoji: shelf.emoji,
    items: books.filter((b) => b.shelf_status === shelf.status),
  }));
}
