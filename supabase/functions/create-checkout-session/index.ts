/**
 * Creates a Stripe Checkout Session for Bookmarked Plus.
 * Requires Authorization: Bearer <user JWT>.
 *
 * Secrets:
 * - STRIPE_SECRET_KEY
 * - STRIPE_PRICE_ID — Plus monthly ($5.99/mo) price_…
 * - STRIPE_PRICE_ID_YEARLY — Plus yearly ($59.99/yr) price_… (optional until catalog cutover)
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

type BillingInterval = "month" | "year";

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
  interval: BillingInterval;
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
    "subscription_data[metadata][tier]": "plus",
    "subscription_data[metadata][interval]": params.interval,
    "metadata[user_id]": params.userId,
    "metadata[tier]": "plus",
    "metadata[interval]": params.interval,
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
  monthlyConfigured: boolean;
  yearlyConfigured: boolean;
} {
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")?.trim();
  const monthlyPriceId = Deno.env.get("STRIPE_PRICE_ID")?.trim();
  const yearlyPriceId = Deno.env.get("STRIPE_PRICE_ID_YEARLY")?.trim();
  const monthlyConfigured = Boolean(stripeSecretKey && monthlyPriceId);
  const yearlyConfigured = Boolean(stripeSecretKey && yearlyPriceId);
  const available = monthlyConfigured;
  const mode = stripeSecretKey?.startsWith("sk_live_")
    ? "live"
    : stripeSecretKey?.startsWith("sk_test_")
      ? "test"
      : "unknown";

  return { available, mode, monthlyConfigured, yearlyConfigured };
}

function parseInterval(value: unknown): BillingInterval {
  return value === "year" || value === "yearly" ? "year" : "month";
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
      intervals: {
        month: config.monthlyConfigured,
        year: config.yearlyConfigured,
      },
      pricing: {
        month: "$5.99",
        year: "$59.99",
      },
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const { available, mode, yearlyConfigured } = stripeCheckoutConfig();

  if (!available) {
    return jsonResponse(
      {
        available: false,
        error: "Stripe checkout is not configured",
        hint: "Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID ($5.99/mo) in Supabase project secrets. Optionally STRIPE_PRICE_ID_YEARLY ($59.99/yr).",
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

  let payload: {
    success_url?: string;
    cancel_url?: string;
    interval?: string;
  } = {};
  if (req.headers.get("content-type")?.includes("application/json")) {
    try {
      payload = (await req.json()) as typeof payload;
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }
  }

  const interval = parseInterval(payload.interval);
  if (interval === "year" && !yearlyConfigured) {
    return jsonResponse(
      {
        available: true,
        error: "Yearly Plus checkout is not configured yet",
        hint: "Create the $59.99/yr Stripe price and set STRIPE_PRICE_ID_YEARLY. See docs/STRIPE_SETUP.md.",
      },
      503
    );
  }

  const successUrl = payload.success_url?.trim() || `${SITE_URL}/upgrade/?checkout=success`;
  const cancelUrl = payload.cancel_url?.trim() || `${SITE_URL}/upgrade/?checkout=canceled`;

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")?.trim() ?? "";
  const stripePriceId =
    interval === "year"
      ? (Deno.env.get("STRIPE_PRICE_ID_YEARLY")?.trim() ?? "")
      : (Deno.env.get("STRIPE_PRICE_ID")?.trim() ?? "");

  try {
    const session = await createStripeCheckoutSession({
      secretKey: stripeSecretKey,
      priceId: stripePriceId,
      userId: userData.user.id,
      email: userData.user.email,
      successUrl,
      cancelUrl,
      interval,
    });

    return jsonResponse({
      available: true,
      mode,
      interval,
      url: session.url,
      sessionId: session.sessionId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("[create-checkout-session]", message);
    return jsonResponse({ error: message }, 502);
  }
});
