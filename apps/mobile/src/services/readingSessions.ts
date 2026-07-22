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
