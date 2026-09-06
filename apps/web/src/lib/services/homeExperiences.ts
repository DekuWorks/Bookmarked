import { createClient } from "@/lib/supabase/client";
import type { HomeExperience } from "@/types";

export async function listHomeExperiences(): Promise<HomeExperience[]> {
  const supabase = createClient();
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
  const supabase = createClient();
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
): Promise<{ join_url: string | null; label: string | null; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_experience_join_config", {
    p_experience_id: experienceId,
  });
  if (error) return { join_url: null, label: null, error: error.message };
  const payload = data as { ok?: boolean; join_url?: string | null; label?: string | null; error?: string };
  if (!payload?.ok) return { join_url: null, label: null, error: payload?.error ?? "Not authorized." };
  return { join_url: payload.join_url ?? null, label: payload.label ?? null };
}

export async function createHomeMeetup(input: {
  title: string;
  description?: string;
  venueKind: "public_venue" | "arbitrary_address" | "virtual";
  venueName?: string;
  cityLabel?: string;
  addressText?: string;
  startsAt: string;
  endsAt?: string;
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_home_meetup", {
    p_title: input.title,
    p_description: input.description ?? null,
    p_venue_kind: input.venueKind,
    p_venue_name: input.venueName ?? null,
    p_city_label: input.cityLabel ?? null,
    p_address_text: input.addressText ?? null,
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt ?? null,
  });
  if (error) return { ok: false, error: error.message };
  const payload = data as { ok?: boolean; error?: string; id?: string };
  return payload?.ok ? { ok: true, id: payload.id } : { ok: false, error: payload?.error };
}
