import { supabase } from "./supabase";
import { SHELF_CONFIG } from "../constants/shelves";
import {
  activityMetadata,
  bookActivityContext,
  recordActivity,
  type ActivityEventType,
} from "./activity";
import type { ShelfStatus, UserBook } from "../types";

export type LibraryBookRow = {
  id: string;
  shelf_status: ShelfStatus;
  progress_percent: number;
  progress_pages: number;
  rating: number | null;
  is_favorite: boolean;
  finished_at: string | null;
  started_at: string | null;
  completion_tags: string[] | null;
  updated_at: string;
  created_at: string;
  books: {
    id: string;
    title: string;
    author: string | null;
    cover_url: string | null;
    page_count: number | null;
    published_date: string | null;
    subjects: string[] | null;
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
  "id, shelf_status, progress_percent, progress_pages, rating, is_favorite, finished_at, started_at, completion_tags, created_at, updated_at, books(id, title, author, cover_url, page_count, published_date, subjects)";

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
    slug: shelf.slug,
    emoji: shelf.emoji,
    items: books.filter((b) => b.shelf_status === shelf.status),
  }));
}

// ---- Sorting (mirrors web useShelfSort) --------------------------------------

export type ShelfSort =
  | "recent"
  | "title"
  | "author"
  | "date_released"
  | "date_added";

export const SHELF_SORT_OPTIONS: { id: ShelfSort; label: string }[] = [
  { id: "recent", label: "Recent progress" },
  { id: "title", label: "Title" },
  { id: "author", label: "Author" },
  { id: "date_released", label: "Date released" },
  { id: "date_added", label: "Date added" },
];

export function sortLibraryBooks(
  books: LibraryBookRow[],
  sort: ShelfSort
): LibraryBookRow[] {
  const copy = [...books];
  switch (sort) {
    case "title":
      return copy.sort((a, b) =>
        (a.books?.title ?? "").localeCompare(b.books?.title ?? "", undefined, {
          sensitivity: "base",
        })
      );
    case "author":
      return copy.sort((a, b) =>
        (a.books?.author ?? "").localeCompare(b.books?.author ?? "", undefined, {
          sensitivity: "base",
        })
      );
    case "date_released":
      return copy.sort((a, b) => {
        const aDate = a.books?.published_date
          ? new Date(a.books.published_date).getTime()
          : 0;
        const bDate = b.books?.published_date
          ? new Date(b.books.published_date).getTime()
          : 0;
        return bDate - aDate;
      });
    case "date_added":
      return copy.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    case "recent":
    default:
      return copy.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
  }
}

// ---- Write actions -----------------------------------------------------------

export async function getUserBook(
  userId: string,
  bookId: string
): Promise<UserBook | null> {
  const { data, error } = await supabase
    .from("user_books")
    .select("*")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .maybeSingle();
  if (error) throw error;
  return (data as UserBook | null) ?? null;
}

async function recordBookActivity(
  userId: string,
  eventType: ActivityEventType,
  userBookId: string | null,
  book: { id: string; title: string; cover_url?: string | null; subjects?: string[] | null },
  extra: Record<string, unknown> = {}
) {
  await recordActivity({
    user_id: userId,
    event_type: eventType,
    entity_type: "user_book",
    entity_id: userBookId,
    metadata_json: activityMetadata(book.title, {
      ...bookActivityContext(book),
      ...extra,
    }),
  });
}

/** Add a shared `books` row to a shelf (or move it), recording activity. */
export async function setShelfStatus(
  userId: string,
  book: { id: string; title: string; cover_url?: string | null; subjects?: string[] | null },
  shelfStatus: ShelfStatus
): Promise<{ error?: string }> {
  const { data: existing } = await supabase
    .from("user_books")
    .select("id, shelf_status")
    .eq("user_id", userId)
    .eq("book_id", book.id)
    .maybeSingle();

  if (existing?.shelf_status === shelfStatus) return {};

  const patch: Record<string, unknown> = {
    user_id: userId,
    book_id: book.id,
    shelf_status: shelfStatus,
    updated_at: new Date().toISOString(),
  };
  if (shelfStatus === "currently_reading") patch.started_at = new Date().toISOString();
  if (shelfStatus === "read") patch.finished_at = new Date().toISOString();

  const { data: userBook, error } = await supabase
    .from("user_books")
    .upsert(patch, { onConflict: "user_id,book_id" })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const eventType: ActivityEventType = existing ? "shelf_updated" : "book_added";
  await recordBookActivity(userId, eventType, userBook?.id ?? null, book, {
    shelf_status: shelfStatus,
    previous_shelf_status: existing?.shelf_status ?? null,
  });

  return {};
}

export async function updateReadingProgress(
  userId: string,
  book: { id: string; title: string; cover_url?: string | null; subjects?: string[] | null; page_count?: number | null },
  input: { progressPages?: number | null; progressPercent: number }
): Promise<{ error?: string }> {
  const { data: userBook, error } = await supabase
    .from("user_books")
    .update({
      progress_percent: input.progressPercent,
      progress_pages: input.progressPages ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("book_id", book.id)
    .select("id")
    .single();

  if (error) return { error: error.message };

  await recordBookActivity(userId, "progress_updated", userBook?.id ?? null, book, {
    progress_percent: input.progressPercent,
  });
  return {};
}

export async function markFinished(
  userId: string,
  book: { id: string; title: string; cover_url?: string | null; subjects?: string[] | null }
): Promise<{ error?: string }> {
  const { data: userBook, error } = await supabase
    .from("user_books")
    .update({
      shelf_status: "read",
      progress_percent: 100,
      finished_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("book_id", book.id)
    .select("id")
    .single();

  if (error) return { error: error.message };

  await recordBookActivity(userId, "book_finished", userBook?.id ?? null, book);
  return {};
}

export async function toggleFavorite(
  userId: string,
  bookId: string,
  isFavorite: boolean
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("user_books")
    .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("book_id", bookId);
  if (error) return { error: error.message };
  return {};
}
