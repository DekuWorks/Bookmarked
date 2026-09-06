import { createClient } from "@/lib/supabase/client";
import { validateReadingGoal } from "@/lib/utils/profileValidation";
import {
  computeYearlyReadingGoal,
  finishEventsFromLibraryBooks,
  type YearlyGoalFinishEvent,
  type YearlyGoalStatus,
} from "@bookmarked/utils/yearlyReadingGoal";
import type { LibraryBookRow } from "@/lib/services/library";

export async function listCompletionFinishEvents(
  userId: string
): Promise<YearlyGoalFinishEvent[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reading_sessions")
    .select("user_book_id, read_number, session_date, activity_kind")
    .eq("user_id", userId)
    .eq("activity_kind", "completion");

  if (error) {
    console.warn("[yearlyGoals] completion events failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    userBookId: row.user_book_id as string,
    readNumber: Number(row.read_number) || 1,
    finishedDate: (row.session_date as string | null) ?? null,
    activityKind: (row.activity_kind as string | null) ?? "completion",
  }));
}

export async function getYearlyGoalTarget(
  userId: string,
  year: number,
  profileFallback: number | null
): Promise<number | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("yearly_reading_goals")
    .select("target")
    .eq("user_id", userId)
    .eq("year", year)
    .maybeSingle();

  if (error) {
    console.warn("[yearlyGoals] target load failed:", error.message);
    return profileFallback;
  }
  if (data?.target) return Number(data.target);
  return year === new Date().getFullYear() ? profileFallback : null;
}

export async function computeUserYearlyGoal(
  userId: string,
  books: LibraryBookRow[],
  profileFallback: number | null,
  year: number = new Date().getFullYear()
): Promise<YearlyGoalStatus> {
  const [events, target] = await Promise.all([
    listCompletionFinishEvents(userId),
    getYearlyGoalTarget(userId, year, profileFallback),
  ]);
  const merged = finishEventsFromLibraryBooks(
    books.map((book) => ({
      id: book.id,
      shelf_status: book.shelf_status,
      dnf: book.dnf,
      finished_at: book.finished_at,
    })),
    events
  );
  return computeYearlyReadingGoal(merged, target, year);
}

export async function upsertYearlyReadingGoal(
  userId: string,
  year: number,
  target: number | null
): Promise<{ error?: string; goal?: number | null }> {
  const supabase = createClient();

  if (target == null) {
    const { error } = await supabase
      .from("yearly_reading_goals")
      .delete()
      .eq("user_id", userId)
      .eq("year", year);
    if (error) return { error: error.message };
    if (year === new Date().getFullYear()) {
      await supabase.from("profiles").update({ yearly_reading_goal: null }).eq("id", userId);
    }
    return { goal: null };
  }

  const validated = validateReadingGoal(target);
  if (!validated.ok) return { error: validated.error };

  const { error } = await supabase.from("yearly_reading_goals").upsert({
    user_id: userId,
    year,
    target: validated.value,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  if (year === new Date().getFullYear()) {
    await supabase
      .from("profiles")
      .update({ yearly_reading_goal: validated.value })
      .eq("id", userId);
  }

  return { goal: validated.value };
}
