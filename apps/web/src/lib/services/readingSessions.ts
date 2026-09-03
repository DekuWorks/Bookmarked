import { createClient } from "@/lib/supabase/client";
import type { ReadingSession } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type CreateReadingSessionInput = {
  userId: string;
  userBookId: string;
  pageStart: number;
  pageEnd: number;
  percentComplete: number;
  note?: string | null;
  mood?: string | null;
  createdAt?: string;
  readNumber?: number;
  sessionFormat?: "book" | "audiobook";
  listeningStartSeconds?: number;
  listeningEndSeconds?: number;
};

export type ReadingStatsInRange = {
  total_pages: number;
  session_count: number;
  active_days: number;
};

export type ReadingPagesByDay = {
  day: string;
  pages_read: number;
  session_count: number;
};

export async function createReadingSessionWithClient(
  supabase: SupabaseClient,
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
      session_format: input.sessionFormat ?? "book",
      ...(input.sessionFormat === "audiobook"
        ? {
            listening_start_seconds: input.listeningStartSeconds ?? 0,
            listening_end_seconds: input.listeningEndSeconds ?? 0,
            listening_seconds: Math.max(
              0,
              (input.listeningEndSeconds ?? 0) - (input.listeningStartSeconds ?? 0)
            ),
          }
        : {}),
      ...(input.createdAt ? { created_at: input.createdAt } : {}),
    })
    .select("*")
    .single();

  if (error) return { error: error.message };
  return { session: data as ReadingSession };
}

export async function createReadingSession(
  input: CreateReadingSessionInput
): Promise<{ error?: string; session?: ReadingSession }> {
  return createReadingSessionWithClient(createClient(), input);
}

export type UserReadingSession = ReadingSession & {
  bookTitle: string | null;
  bookAuthor: string | null;
  bookId: string | null;
  bookCoverUrl: string | null;
};

type UserBookJoinRow = {
  book_id: string;
  books:
    | { title: string; author: string | null; cover_url: string | null }
    | { title: string; author: string | null; cover_url: string | null }[]
    | null;
};

export async function listUserReadingSessions(
  userId: string,
  limit = 100
): Promise<UserReadingSession[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("reading_sessions")
    .select("*, user_books(book_id, books(title, author, cover_url))")
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
      bookAuthor: book?.author ?? null,
      bookId: join?.book_id ?? null,
      bookCoverUrl: book?.cover_url ?? null,
    };
  });
}

export async function listReadingSessions(
  userBookId: string
): Promise<ReadingSession[]> {
  const supabase = createClient();

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

export async function getReadingStatsInRange(
  userId: string,
  start: Date,
  end: Date
): Promise<ReadingStatsInRange | null> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("reading_stats_in_range", {
    p_user_id: userId,
    p_start: start.toISOString(),
    p_end: end.toISOString(),
  });

  if (error) {
    console.error("[readingSessions] stats failed:", error);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { total_pages: 0, session_count: 0, active_days: 0 };

  return {
    total_pages: Number(row.total_pages ?? 0),
    session_count: Number(row.session_count ?? 0),
    active_days: Number(row.active_days ?? 0),
  };
}

export async function getReadingPagesByDay(
  userId: string,
  start: Date,
  end: Date
): Promise<ReadingPagesByDay[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("reading_pages_by_day", {
    p_user_id: userId,
    p_start: start.toISOString(),
    p_end: end.toISOString(),
  });

  if (error) {
    console.error("[readingSessions] pages by day failed:", error);
    return [];
  }

  return (data ?? []).map((row: ReadingPagesByDay) => ({
    day: row.day,
    pages_read: Number(row.pages_read ?? 0),
    session_count: Number(row.session_count ?? 0),
  }));
}

export type UpdateReadingSessionInput = {
  note?: string | null;
  mood?: string | null;
};

export async function updateReadingSession(
  sessionId: string,
  input: UpdateReadingSessionInput
): Promise<{ error?: string; session?: ReadingSession }> {
  const supabase = createClient();
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

/** @deprecated Use updateReadingSession */
export async function updateReadingSessionNote(
  sessionId: string,
  note: string | null
): Promise<{ error?: string; session?: ReadingSession }> {
  return updateReadingSession(sessionId, { note });
}
