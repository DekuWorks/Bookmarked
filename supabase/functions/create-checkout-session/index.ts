/**
 * Creates a Stripe Checkout Session for Bookmarked Premium.
 * Requires Authorization: Bearer <user JWT>.
 *
 * Secrets:
 * - STRIPE_SECRET_KEY
 * - STRIPE_PRICE_ID — recurring price for Premium ($4.99/mo)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE_URL = "https://bookmarked.online";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

async function createStripeCheckoutSession(params: {
  secretKey: string;
  priceId: string;
  userId: string;
  email?: string | null;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string; sessionId: string }> {
  const body = new URLSearchParams({
    mode: "subscription",
    client_reference_id: params.userId,
    "line_items[0][price]": params.priceId,
    "line_items[0][quantity]": "1",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    "subscription_data[metadata][user_id]": params.userId,
    "subscription_data[metadata][supabase_user_id]": params.userId,
  });

  if (params.email) {
    body.set("customer_email", params.email);
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  });

  const data = (await response.json()) as {
    id?: string;
    url?: string;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Stripe checkout session failed");
  }

  if (!data.url || !data.id) {
    throw new Error("Stripe checkout session missing redirect URL");
  }

  return { url: data.url, sessionId: data.id };
}

function stripeCheckoutConfig(): {
  available: boolean;
  mode: "live" | "test" | "unknown";
} {
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")?.trim();
  const stripePriceId = Deno.env.get("STRIPE_PRICE_ID")?.trim();
  const available = Boolean(stripeSecretKey && stripePriceId);
  const mode = stripeSecretKey?.startsWith("sk_live_")
    ? "live"
    : stripeSecretKey?.startsWith("sk_test_")
      ? "test"
      : "unknown";

  return { available, mode };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method === "GET") {
    const config = stripeCheckoutConfig();
    return jsonResponse({
      available: config.available,
      mode: config.available ? config.mode : undefined,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const { available, mode } = stripeCheckoutConfig();

  if (!available) {
    return jsonResponse(
      {
        available: false,
        error: "Stripe checkout is not configured",
        hint: "Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID in Supabase project secrets.",
      },
      503
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !serviceKey || !anonKey) {
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const jwt = authHeader.slice("Bearer ".length);
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser(jwt);
  if (userError || !userData.user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let payload: { success_url?: string; cancel_url?: string } = {};
  if (req.headers.get("content-type")?.includes("application/json")) {
    try {
      payload = (await req.json()) as typeof payload;
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }
  }

  const successUrl = payload.success_url?.trim() || `${SITE_URL}/upgrade/?checkout=success`;
  const cancelUrl = payload.cancel_url?.trim() || `${SITE_URL}/upgrade/?checkout=canceled`;

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")?.trim() ?? "";
  const stripePriceId = Deno.env.get("STRIPE_PRICE_ID")?.trim() ?? "";

  try {
    const session = await createStripeCheckoutSession({
      secretKey: stripeSecretKey,
      priceId: stripePriceId,
      userId: userData.user.id,
      email: userData.user.email,
      successUrl,
      cancelUrl,
    });

    return jsonResponse({
      available: true,
      mode,
      url: session.url,
      sessionId: session.sessionId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("[create-checkout-session]", message);
    return jsonResponse({ error: message }, 502);
  }
});
