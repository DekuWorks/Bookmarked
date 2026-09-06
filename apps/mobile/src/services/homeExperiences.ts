import type { HomeExperience } from "../../../../packages/types";
import { supabase } from "./supabase";

export async function listHomeExperiences(): Promise<HomeExperience[]> {
  const { data, error } = await supabase
    .from("home_experiences_public")
    .select(
      "id, kind, title, description, starts_at, ends_at, visibility, is_beta, venue_kind, venue_name, city_label, video_provider, required_tier, merch_window_starts_at, merch_window_ends_at, partner_benefit_key, rsvp_priority_window_starts_at, rsvp_priority_window_ends_at, created_at"
    )
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as HomeExperience[];
}

export async function rsvpHomeExperience(
  experienceId: string,
  rsvpStatus: "going" | "maybe" | "not_going"
): Promise<{ error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const { error } = await supabase.from("home_experience_rsvps").upsert({
    experience_id: experienceId,
    user_id: user.id,
    rsvp_status: rsvpStatus,
  });
  return error ? { error: error.message } : {};
}

export async function getExperienceJoinConfig(
  experienceId: string
): Promise<{ join_url: string | null; error?: string }> {
  const { data, error } = await supabase.rpc("get_experience_join_config", {
    p_experience_id: experienceId,
  });
  if (error) return { join_url: null, error: error.message };
  const payload = data as { ok?: boolean; join_url?: string | null; error?: string };
  if (!payload?.ok) return { join_url: null, error: payload?.error ?? "Not authorized." };
  return { join_url: payload.join_url ?? null };
}

export async function submitFeatureRequest(input: {
  title: string;
  description: string;
  category: string;
  problem: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("submit_feature_request", {
    p_title: input.title,
    p_description: input.description,
    p_category: input.category,
    p_problem: input.problem,
    p_screenshot_url: null,
  });
  if (error) return { ok: false, error: error.message };
  const payload = data as { ok?: boolean; error?: string };
  return payload?.ok ? { ok: true } : { ok: false, error: payload?.error };
}

export async function submitSupportTicket(
  subject: string,
  body: string
): Promise<{ ok: boolean; error?: string; priority_tag?: string }> {
  const { data, error } = await supabase.rpc("submit_support_ticket", {
    p_subject: subject,
    p_body: body,
  });
  if (error) return { ok: false, error: error.message };
  const payload = data as { ok?: boolean; error?: string; priority_tag?: string };
  return payload?.ok
    ? { ok: true, priority_tag: payload.priority_tag }
    : { ok: false, error: payload?.error };
}
