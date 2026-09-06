import { createClient } from "@/lib/supabase/client";
import { getUserLibraryBooks } from "@/lib/services/library";
import { listUserReadingSessions } from "@/lib/services/readingSessions";
import { finishEventsFromLibraryBooks, type YearlyGoalFinishEvent } from "@bookmarked/utils/yearlyReadingGoal";
import {
  computePagesByMonth,
  computePagesByWeek,
  computeReadingHabits,
  computeReadingSpeed,
  computeReadingTime,
  computeYearOverYear,
  type PlusInsightSession,
} from "@bookmarked/utils/plusInsights";
import { computeMoodAnalytics } from "@bookmarked/utils/moodAnalytics";

export async function loadPlusInsightSessions(userId: string): Promise<PlusInsightSession[]> {
  const sessions = await listUserReadingSessions(userId, 800);
  return sessions.map((session) => ({
    session_date: session.session_date,
    created_at: session.created_at,
    pages_read: session.pages_read,
    duration_seconds: session.duration_seconds,
    listening_seconds: session.listening_seconds,
    listening_start_seconds: session.listening_start_seconds,
    listening_end_seconds: session.listening_end_seconds,
    session_format: session.session_format,
    activity_kind: session.activity_kind,
    mood: session.mood,
    bookAuthor: session.bookAuthor,
  }));
}

export async function loadPlusInsightsDashboard(userId: string) {
  const [sessions, books] = await Promise.all([
    loadPlusInsightSessions(userId),
    getUserLibraryBooks(userId),
  ]);

  const finishEvents: YearlyGoalFinishEvent[] = finishEventsFromLibraryBooks(
    books.map((row) => ({
      id: row.id,
      shelf_status: row.shelf_status,
      dnf: row.dnf,
      finished_at: row.finished_at,
    }))
  );

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear].map((year) => {
    const yearSessions = sessions.filter((session) => session.session_date?.startsWith(String(year)));
    return {
      year,
      pages: yearSessions.reduce((sum, session) => {
        if (session.session_format === "audiobook") return sum;
        return sum + (Number(session.pages_read) || 0);
      }, 0),
      listeningSeconds: yearSessions.reduce((sum, session) => sum + (Number(session.listening_seconds) || 0), 0),
      booksFinished: finishEvents.filter((event) => event.finishedDate?.startsWith(String(year))).length,
    };
  });

  return {
    speed: computeReadingSpeed(sessions),
    time: computeReadingTime(sessions),
    pagesByWeek: computePagesByWeek(sessions),
    pagesByMonth: computePagesByMonth(sessions),
    habits: computeReadingHabits(sessions),
    moods: computeMoodAnalytics(sessions.map((session) => session.mood)),
    yearOverYear: computeYearOverYear({ years, currentYear }),
  };
}

export async function listFavoriteAuthors(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_favorite_authors")
    .select("id, author_name, note, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addFavoriteAuthor(userId: string, authorName: string, note?: string) {
  const supabase = createClient();
  const { error } = await supabase.from("user_favorite_authors").insert({
    user_id: userId,
    author_name: authorName,
    author_key: authorName.trim().toLowerCase(),
    note: note ?? null,
  });
  if (error) return { error: error.message };
  return { ok: true as const };
}

export async function listAdvancedGoals(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("advanced_reading_goals")
    .select("id, title, kind, target_amount, progress_amount, is_active, params")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createAdvancedGoal(input: {
  userId: string;
  title: string;
  kind: string;
  targetAmount: number;
}) {
  const supabase = createClient();
  const { error } = await supabase.from("advanced_reading_goals").insert({
    user_id: input.userId,
    title: input.title,
    kind: input.kind,
    target_amount: input.targetAmount,
  });
  if (error) return { error: error.message };
  return { ok: true as const };
}
