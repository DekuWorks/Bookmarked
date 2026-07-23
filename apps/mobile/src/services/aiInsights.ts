import {
  buildAiInsightsContext,
  generateAiInsights,
  parseOpenAiInsightsResponse,
  type AiInsightsResult,
  type GenerateAiInsightsInput,
} from "../../../../packages/utils/aiInsights";
import { getUserLibraryBooks } from "./library";
import { getProfile } from "./profile";
import { fetchReadingStreakTimestamps } from "./readingInsights";
import { listUserReviews } from "./readingRoom";
import { listUserReadingSessions } from "./readingSessions";
import { supabase } from "./supabase";

export type { AiInsightItem, AiInsightsResult } from "../../../../packages/utils/aiInsights";

type AiInsightsEdgeResponse = {
  source?: "openai" | "fallback";
  insights?: AiInsightsResult | null;
};

function mapToInsightsInput(
  sessions: Awaited<ReturnType<typeof listUserReadingSessions>>,
  books: Awaited<ReturnType<typeof getUserLibraryBooks>>,
  reviews: Awaited<ReturnType<typeof listUserReviews>>,
  favoriteGenres: string[] | null,
  streakTimestamps: string[]
): GenerateAiInsightsInput {
  return {
    sessions: sessions.map((session) => ({
      id: session.id,
      user_book_id: session.user_book_id,
      created_at: session.created_at,
      pages_read: session.pages_read,
      note: session.note,
      mood: session.mood,
      read_number: session.read_number,
      bookTitle: session.bookTitle,
      bookId: session.bookId,
    })),
    books: books.map((row) => ({
      id: row.id,
      shelf_status: row.shelf_status,
      progress_pages: row.progress_pages,
      progress_percent: row.progress_percent,
      is_favorite: row.is_favorite,
      dnf: row.dnf,
      finished_at: row.finished_at,
      rating: row.rating,
      bookTitle: row.books?.title ?? null,
      subjects: row.books?.subjects ?? null,
    })),
    reviews: reviews.map((review) => ({
      bookTitle: review.books?.title ?? null,
      rating: review.rating,
      review_body: review.review_body,
      feelings: review.feelings ?? [],
      created_at: review.created_at,
    })),
    favoriteGenres,
    streakTimestamps,
  };
}

async function tryOpenAiInsights(input: GenerateAiInsightsInput): Promise<AiInsightsResult> {
  const context = buildAiInsightsContext(input);
  if (!context.hasData) {
    return generateAiInsights(input);
  }

  try {
    const { data, error } = await supabase.functions.invoke<AiInsightsEdgeResponse>("ai-insights", {
      body: { context },
    });

    if (!error && data?.source === "openai" && data.insights) {
      const parsed = parseOpenAiInsightsResponse(data.insights, context.hasData);
      if (parsed) return parsed;
    }
  } catch {
    // Fall through to rule-based insights.
  }

  return generateAiInsights(input);
}

export async function getAiInsights(userId: string): Promise<AiInsightsResult> {
  const [sessions, books, reviews, streakTimestamps, profile] = await Promise.all([
    listUserReadingSessions(userId, 500),
    getUserLibraryBooks(userId),
    listUserReviews(userId, 50),
    fetchReadingStreakTimestamps(userId).catch(() => [] as string[]),
    getProfile(userId),
  ]);

  const input = mapToInsightsInput(
    sessions,
    books,
    reviews,
    profile?.favorite_genres ?? null,
    streakTimestamps
  );

  return tryOpenAiInsights(input);
}
