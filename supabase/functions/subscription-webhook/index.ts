/**
 * Subscription webhook stub — updates user_subscriptions from payment providers.
 *
 * Configure secrets:
 * - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injected by Supabase)
 * - SUBSCRIPTION_WEBHOOK_SECRET — shared secret for Stripe/App Store relay
 *
 * Stripe: point webhook to POST /functions/v1/subscription-webhook?provider=stripe
 * Apple/Google: relay server-to-server notifications with the same secret header.
 *
 * This function is a scaffold — signature verification and provider-specific
 * payload parsing must be completed before going live.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-subscription-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SubscriptionProvider = "stripe" | "apple" | "google" | "manual";
type SubscriptionTier = "free" | "premium";
type SubscriptionStatus = "inactive" | "active" | "trialing" | "past_due" | "canceled";

type WebhookPayload = {
  user_id: string;
  subscription_tier?: SubscriptionTier;
  subscription_status?: SubscriptionStatus;
  subscription_provider?: SubscriptionProvider;
  subscription_expires_at?: string | null;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const webhookSecret = Deno.env.get("SUBSCRIPTION_WEBHOOK_SECRET")?.trim();
  if (!webhookSecret) {
    console.error("[subscription-webhook] SUBSCRIPTION_WEBHOOK_SECRET is not set");
    return jsonResponse(
      {
        error: "Webhook not configured",
        hint: "Set SUBSCRIPTION_WEBHOOK_SECRET and redeploy the function.",
      },
      503
    );
  }

  const providedSecret = req.headers.get("x-subscription-webhook-secret")?.trim();
  if (providedSecret !== webhookSecret) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const url = new URL(req.url);
  const providerParam = url.searchParams.get("provider")?.trim() as
    | SubscriptionProvider
    | undefined;

  let payload: WebhookPayload;
  try {
    payload = (await req.json()) as WebhookPayload;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!payload.user_id || !isUuid(payload.user_id)) {
    return jsonResponse({ error: "user_id must be a valid UUID" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[subscription-webhook] Supabase service credentials missing");
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const update = {
    subscription_tier: payload.subscription_tier ?? "premium",
    subscription_status: payload.subscription_status ?? "active",
    subscription_provider: payload.subscription_provider ?? providerParam ?? "manual",
    subscription_expires_at: payload.subscription_expires_at ?? null,
  };

  const { data, error } = await supabase
    .from("user_subscriptions")
    .upsert({ user_id: payload.user_id, ...update }, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    console.error("[subscription-webhook] upsert failed:", error.message);
    return jsonResponse({ error: "Failed to update subscription" }, 500);
  }

  return jsonResponse({
    ok: true,
    provider: providerParam ?? update.subscription_provider,
    subscription: data,
    note: "Stub webhook — add provider signature verification before production use.",
  });
});
