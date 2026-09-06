import { createClient } from "@/lib/supabase/client";
import type { AiCompanionAction } from "@bookmarked/utils/aiCompanionSafety";

export async function requestAiCompanion(input: {
  action: AiCompanionAction;
  bookTitle: string;
  format?: "book" | "audiobook";
  shelfStatus?: string | null;
  progressPercent?: number | null;
  endingConfirmed?: boolean;
  /** Structured DNA summary only — never a full library dump. */
  dnaSummary?: Record<string, unknown> | null;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke<{
    result?: { title?: string; body?: string };
    error?: string;
  }>("ai-reading-companion", { body: input });
  if (error) return { error: error.message };
  if (data?.error) return { error: data.error };
  return { result: data?.result ?? null };
}
