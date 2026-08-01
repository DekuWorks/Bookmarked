import { getSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; available: false; error: string }
  | { ok: false; available: true; error: string };

export type CheckoutAvailability = {
  available: boolean;
  mode?: "live" | "test" | "unknown";
};

export async function getPremiumCheckoutAvailability(): Promise<CheckoutAvailability> {
  const envResult = getSupabaseEnv();
  if (!envResult.ok) {
    return { available: false };
  }

  const { url: supabaseUrl, anonKey } = envResult.env;

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
      method: "GET",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });

    const body = (await response.json().catch(() => null)) as {
      available?: boolean;
      mode?: "live" | "test" | "unknown";
    } | null;

    return {
      available: Boolean(body?.available),
      mode: body?.mode,
    };
  } catch {
    return { available: false };
  }
}

export type CheckoutInterval = "month" | "year";

export async function createPremiumCheckoutSession(
  interval: CheckoutInterval = "month"
): Promise<CheckoutResult> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { ok: false, available: true, error: "You must be signed in." };
  }

  const envResult = getSupabaseEnv();
  if (!envResult.ok) {
    return { ok: false, available: false, error: "Server misconfigured." };
  }

  const { url: supabaseUrl, anonKey } = envResult.env;

  const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ interval }),
  });

  const body = (await response.json().catch(() => null)) as {
    available?: boolean;
    url?: string;
    error?: string;
    hint?: string;
  } | null;

  if (response.status === 503 || body?.available === false) {
    return {
      ok: false,
      available: false,
      error: body?.error ?? "Stripe checkout is not configured yet.",
    };
  }

  if (!response.ok || !body?.url) {
    return {
      ok: false,
      available: true,
      error: body?.error ?? "Could not start checkout. Please try again.",
    };
  }

  return { ok: true, url: body.url };
}
