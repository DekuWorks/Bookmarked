import { supabase } from "./supabase";
import { getUserSubscription, toSubscriptionAccess } from "./subscription";
import { canAccessFeature } from "../utils/subscription";
import type { AiCompanionAction } from "../../../../packages/utils/aiCompanionSafety";

export async function requestAiCompanion(input: {
  action: AiCompanionAction;
  bookTitle: string;
  format?: "book" | "audiobook";
  shelfStatus?: string | null;
  progressPercent?: number | null;
  endingConfirmed?: boolean;
}) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { error: "You must be signed in." };
    const access = toSubscriptionAccess(await getUserSubscription(userData.user.id));
    if (!canAccessFeature("ai_companion", access)) return { error: "Premium required" };
  } catch {
    return { error: "Premium required" };
  }

  const { data, error } = await supabase.functions.invoke<{
    result?: { title?: string; body?: string };
    error?: string;
  }>("ai-reading-companion", { body: input });
  if (error) return { error: error.message };
  if (data?.error) return { error: data.error };
  return { result: data?.result ?? null };
}
