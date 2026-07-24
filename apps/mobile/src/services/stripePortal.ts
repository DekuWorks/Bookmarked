import { env } from "../constants/env";
import { supabase } from "./supabase";

export type BillingPortalResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function createBillingPortalSession(): Promise<BillingPortalResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { ok: false, error: "You must be signed in." };
  }

  const returnUrl = `${env.siteUrl}/upgrade/`;

  const response = await fetch(`${env.supabaseUrl}/functions/v1/create-billing-portal-session`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: env.supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ return_url: returnUrl }),
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
