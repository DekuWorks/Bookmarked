import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

export function profileIsComplete(profile: Profile | null): boolean {
  return Boolean(profile?.username?.trim());
}
