import { supabase } from "./supabase";
import type { ReadingSession } from "../types";

/** Mobile reading sessions — mirrors apps/web/src/lib/services/readingSessions.ts. */

export type CreateReadingSessionInput = {
  userId: string;
  userBookId: string;
  pageStart: number;
  pageEnd: number;
  percentComplete: number;
  note?: string | null;
  mood?: string | null;
  readNumber?: number;
  createdAt?: string;
};

export async function listReadingSessions(userBookId: string): Promise<ReadingSession[]> {
  const { data, error } = await supabase
    .from("reading_sessions")
    .select("*")
    .eq("user_book_id", userBookId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[readingSessions] list failed:", error);
    return [];
  }
  return (data ?? []) as ReadingSession[];
}

export type UserReadingSession = ReadingSession & {
  bookTitle: string | null;
  bookId: string | null;
};

type UserBookJoinRow = {
  book_id: string;
  books: { title: string } | { title: string }[] | null;
};

export async function listUserReadingSessions(
  userId: string,
  limit = 100
): Promise<UserReadingSession[]> {
  const { data, error } = await supabase
    .from("reading_sessions")
    .select("*, user_books(book_id, books(title))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[readingSessions] list user failed:", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const { user_books: userBook, ...session } = row as ReadingSession & {
      user_books: UserBookJoinRow | UserBookJoinRow[] | null;
    };
    const join = Array.isArray(userBook) ? userBook[0] : userBook;
    const books = join?.books;
    const book = Array.isArray(books) ? books[0] : books;

    return {
      ...(session as ReadingSession),
      bookTitle: book?.title ?? null,
      bookId: join?.book_id ?? null,
    };
  });
}

export async function createReadingSession(
  input: CreateReadingSessionInput
): Promise<{ error?: string; session?: ReadingSession }> {
  const pagesRead = Math.max(0, input.pageEnd - input.pageStart);
  const { data, error } = await supabase
    .from("reading_sessions")
    .insert({
      user_id: input.userId,
      user_book_id: input.userBookId,
      page_start: input.pageStart,
      page_end: input.pageEnd,
      pages_read: pagesRead,
      percent_complete: input.percentComplete,
      note: input.note ?? null,
      mood: input.mood ?? null,
      read_number: input.readNumber ?? 1,
      ...(input.createdAt ? { created_at: input.createdAt } : {}),
    })
    .select("*")
    .single();

  if (error) return { error: error.message };
  return { session: data as ReadingSession };
}

export type UpdateReadingSessionInput = {
  note?: string | null;
  mood?: string | null;
};

export async function updateReadingSession(
  sessionId: string,
  input: UpdateReadingSessionInput
): Promise<{ error?: string; session?: ReadingSession }> {
  const patch: { note?: string | null; mood?: string | null } = {};

  if (input.note !== undefined) {
    patch.note = input.note?.trim() ? input.note.trim() : null;
  }
  if (input.mood !== undefined) {
    patch.mood = input.mood || null;
  }

  if (Object.keys(patch).length === 0) {
    return { error: "Nothing to update." };
  }

  const { data, error } = await supabase
    .from("reading_sessions")
    .update(patch)
    .eq("id", sessionId)
    .select("*")
    .single();

  if (error) return { error: error.message };
  return { session: data as ReadingSession };
}
