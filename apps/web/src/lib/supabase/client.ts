import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { getAuthStorage } from "@/lib/auth/rememberMe";
import { assertSupabaseEnv } from "@/lib/env";

let browserClient: SupabaseClient | undefined;

/** Drop cached client so the next createClient() picks up current auth storage. */
export function resetBrowserClient(): void {
  browserClient = undefined;
}

/**
 * Browser Supabase client for the static GitHub Pages export.
 *
 * Uses implicit flow (not PKCE) so email confirmation and password-reset links
 * work when opened on a different device/browser than the one that requested them.
 * `@supabase/ssr` createBrowserClient hardcodes PKCE, which breaks that case.
 */
export function createClient() {
  if (browserClient) return browserClient;

  const { url, anonKey } = assertSupabaseEnv();
  browserClient = createSupabaseClient(url, anonKey, {
    auth: {
      storage: getAuthStorage(),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "implicit",
    },
  });

  return browserClient;
}
