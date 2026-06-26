import { createBrowserClient } from "@supabase/ssr";
import { getAuthStorage } from "@/lib/auth/rememberMe";
import { assertSupabaseEnv } from "@/lib/env";

export function createClient() {
  const { url, anonKey } = assertSupabaseEnv();
  return createBrowserClient(url, anonKey, {
    auth: {
      storage: getAuthStorage(),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
