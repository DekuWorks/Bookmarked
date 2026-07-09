import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthStorage } from "@/lib/auth/rememberMe";
import { assertSupabaseEnv } from "@/lib/env";

let browserClient: SupabaseClient | undefined;

/** Drop cached client so the next createClient() picks up current auth storage. */
export function resetBrowserClient(): void {
  browserClient = undefined;
}

export function createClient() {
  if (browserClient) return browserClient;

  const { url, anonKey } = assertSupabaseEnv();
  browserClient = createBrowserClient(url, anonKey, {
    auth: {
      storage: getAuthStorage(),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}
