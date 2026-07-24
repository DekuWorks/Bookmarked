import { getSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

export type BillingPortalResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function createBillingPortalSession(
  returnUrl = "/upgrade/"
): Promise<BillingPortalResult> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { ok: false, error: "You must be signed in." };
  }

  const envResult = getSupabaseEnv();
  if (!envResult.ok) {
    return { ok: false, error: "Server misconfigured." };
  }

  const { url: supabaseUrl, anonKey } = envResult.env;
  const absoluteReturnUrl =
    typeof window !== "undefined"
      ? new URL(returnUrl, window.location.origin).toString()
      : returnUrl;

  const response = await fetch(`${supabaseUrl}/functions/v1/create-billing-portal-session`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ return_url: absoluteReturnUrl }),
  });

  const body = (await response.json().catch(() => null)) as {
    url?: string;
    error?: string;
    hint?: string;
  } | null;

  if (!response.ok || !body?.url) {
    const message = body?.error ?? "Could not open billing portal. Please try again.";
    return { ok: false, error: body?.hint ? `${message} ${body.hint}` : message };
  }

  return { ok: true, url: body.url };
}
