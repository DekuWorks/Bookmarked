export type ShelfStatus = "want_to_read" | "currently_reading" | "read";

export type LibraryViewMode = "bookshelf" | "grid" | "reading_room";

export type ReviewVisibility = "public" | "followers" | "private";

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  favorite_genres: string[] | null;
  preferred_library_view: LibraryViewMode;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  external_source: string | null;
  external_id: string | null;
  title: string;
  author: string | null;
  description: string | null;
  cover_url: string | null;
  page_count: number | null;
  published_date: string | null;
  isbn: string | null;
  created_at: string;
}
