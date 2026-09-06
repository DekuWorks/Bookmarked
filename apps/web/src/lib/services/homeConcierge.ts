import { createClient } from "@/lib/supabase/client";
import {
  sanitizeFeatureRequestInput,
  type FeatureRequestDraft,
} from "@bookmarked/utils/homeConcierge";

export async function submitFeatureRequest(
  draft: FeatureRequestDraft
): Promise<{ ok: boolean; error?: string }> {
  const clean = sanitizeFeatureRequestInput(draft);
  const supabase = createClient();
  const { data, error } = await supabase.rpc("submit_feature_request", {
    p_title: clean.title,
    p_description: clean.description,
    p_category: clean.category,
    p_problem: clean.problem,
    p_screenshot_url: clean.screenshot_url ?? null,
  });
  if (error) return { ok: false, error: error.message };
  const payload = data as { ok?: boolean; error?: string };
  return payload?.ok ? { ok: true } : { ok: false, error: payload?.error };
}

export async function submitSupportTicket(
  subject: string,
  body: string
): Promise<{ ok: boolean; error?: string; priority_tag?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("submit_support_ticket", {
    p_subject: subject.trim(),
    p_body: body.trim(),
  });
  if (error) return { ok: false, error: error.message };
  const payload = data as { ok?: boolean; error?: string; priority_tag?: string };
  return payload?.ok
    ? { ok: true, priority_tag: payload.priority_tag }
    : { ok: false, error: payload?.error };
}
