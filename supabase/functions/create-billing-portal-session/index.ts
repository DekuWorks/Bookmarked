/**
 * Creates a Stripe Billing Portal session for managing Premium subscription.
 * Requires Authorization: Bearer <user JWT> and an existing stripe_customer_id.
 *
 * Secrets:
 * - STRIPE_SECRET_KEY
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

async function createStripeBillingPortalSession(params: {
  secretKey: string;
  customerId: string;
  returnUrl: string;
}): Promise<{ url: string }> {
  const body = new URLSearchParams({
    customer: params.customerId,
    return_url: params.returnUrl,
  });

  const response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  });

  const data = (await response.json()) as {
    url?: string;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Stripe billing portal session failed");
  }

  if (!data.url) {
    throw new Error("Stripe billing portal session missing redirect URL");
  }

  return { url: data.url };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")?.trim();
  if (!stripeSecretKey) {
    return jsonResponse(
      {
        available: false,
        error: "Stripe billing portal is not configured",
        hint: "Set STRIPE_SECRET_KEY in Supabase project secrets.",
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

  let payload: { return_url?: string } = {};
  if (req.headers.get("content-type")?.includes("application/json")) {
    try {
      payload = (await req.json()) as typeof payload;
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }
  }

  const returnUrl = payload.return_url?.trim() || `${SITE_URL}/upgrade/`;

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: subscription, error: subscriptionError } = await adminClient
    .from("user_subscriptions")
    .select("stripe_customer_id, subscription_provider")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (subscriptionError) {
    console.error("[create-billing-portal-session] lookup failed:", subscriptionError.message);
    return jsonResponse({ error: "Could not load subscription" }, 500);
  }

  const stripeCustomerId = subscription?.stripe_customer_id?.trim();
  if (!stripeCustomerId) {
    return jsonResponse(
      {
        error: "No Stripe subscription found for this account.",
        hint: "Manage Apple subscriptions in iOS Settings → Subscriptions.",
      },
      404
    );
  }

  try {
    const session = await createStripeBillingPortalSession({
      secretKey: stripeSecretKey,
      customerId: stripeCustomerId,
      returnUrl,
    });

    return jsonResponse({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Billing portal failed";
    console.error("[create-billing-portal-session]", message);
    return jsonResponse({ error: message }, 502);
  }
});
