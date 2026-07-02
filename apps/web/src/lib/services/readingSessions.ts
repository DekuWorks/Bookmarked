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
