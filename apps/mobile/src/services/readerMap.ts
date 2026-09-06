import { resolveAgeEligibility, type AgeEligibilityStatus } from "../../../../packages/utils/homeEligibility";
import {
  DEFAULT_READER_MAP_SETTINGS,
  type ReaderMapSettings,
  type VisibleReaderCard,
} from "../../../../packages/utils/readerMap";
import { supabase } from "./supabase";

export async function loadReaderMapSettings(): Promise<ReaderMapSettings> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_READER_MAP_SETTINGS;
  const { data } = await supabase
    .from("reader_map_settings")
    .select(
      "opted_in, discoverable, share_personality, share_college, city_label, college_label, birth_year"
    )
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return DEFAULT_READER_MAP_SETTINGS;
  return {
    opted_in: Boolean(data.opted_in),
    discoverable: Boolean(data.discoverable),
    share_personality: Boolean(data.share_personality),
    share_college: Boolean(data.share_college),
    city_label: data.city_label ?? null,
    college_label: data.college_label ?? null,
    birth_year: data.birth_year ?? null,
  };
}

export async function saveReaderMapSettings(
  patch: Partial<ReaderMapSettings>
): Promise<{ error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const { error } = await supabase.from("reader_map_settings").upsert({
    user_id: user.id,
    ...patch,
  });
  return error ? { error: error.message } : {};
}

export async function loadAgeStatus(): Promise<AgeEligibilityStatus> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "unknown";
  const { data, error } = await supabase.rpc("reader_map_age_status", { p_user_id: user.id });
  if (error || typeof data !== "string") {
    const settings = await loadReaderMapSettings();
    return resolveAgeEligibility({ birthYear: settings.birth_year, minAge: null });
  }
  if (data === "eligible" || data === "under_minimum" || data === "unknown") return data;
  return "unknown";
}

export async function upsertReaderMapPresence(input: {
  lat: number;
  lng: number;
  cityLabel?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("upsert_reader_map_presence", {
    p_lat: input.lat,
    p_lng: input.lng,
    p_city_label: input.cityLabel ?? null,
  });
  if (error) return { ok: false, error: error.message };
  const payload = data as { ok?: boolean; error?: string };
  return payload?.ok ? { ok: true } : { ok: false, error: payload?.error };
}

export async function listReaderMapMarkers(bounds: {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}): Promise<VisibleReaderCard[]> {
  const { data, error } = await supabase.rpc("list_reader_map_markers", {
    p_min_lat: bounds.minLat,
    p_max_lat: bounds.maxLat,
    p_min_lng: bounds.minLng,
    p_max_lng: bounds.maxLng,
    p_limit: 40,
  });
  if (error) throw error;
  return (data ?? []) as VisibleReaderCard[];
}
