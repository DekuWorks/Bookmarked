import { useQuery } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { useAuthStore } from "../store/authStore";
import type { Profile } from "../types";

export function useProfile() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async (): Promise<Profile | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
    enabled: Boolean(userId),
  });
}
