/**
 * Subscription webhook — updates user_subscriptions from payment providers.
 *
 * Configure secrets:
 * - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injected by Supabase)
 * - SUBSCRIPTION_WEBHOOK_SECRET — shared secret for manual / relay payloads
 * - STRIPE_WEBHOOK_SECRET — Stripe signing secret (whsec_…)
 *
 * Stripe: point webhook to POST /functions/v1/subscription-webhook?provider=stripe
 * Manual relay: POST with header x-subscription-webhook-secret
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-subscription-webhook-secret, stripe-signature",
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

type StripeEvent = {
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

type SubscriptionUpdate = {
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  subscription_provider: SubscriptionProvider;
  subscription_expires_at: string | null;
  stripe_customer_id?: string | null;
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

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function parseStripeSignatureHeader(header: string): { timestamp: string; signatures: string[] } | null {
  const parts = header.split(",");
  let timestamp = "";
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split("=", 2);
    if (!key || !value) continue;
    if (key === "t") timestamp = value;
    if (key === "v1") signatures.push(value);
  }

  if (!timestamp || signatures.length === 0) return null;
  return { timestamp, signatures };
}

async function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): Promise<boolean> {
  const parsed = parseStripeSignatureHeader(signatureHeader);
  if (!parsed) return false;

  const signedPayload = `${parsed.timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
  const expected = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return parsed.signatures.some((signature) => timingSafeEqual(signature, expected));
}

function stripeStatusFromSubscription(status: string | undefined): SubscriptionStatus {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "inactive";
  }
}

function unixToIso(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return new Date(value * 1000).toISOString();
}

function stripeCustomerIdFromObject(object: Record<string, unknown>): string | null {
  const customer = object.customer;
  if (typeof customer === "string" && customer.startsWith("cus_")) return customer;
  return null;
}

function userIdFromStripeObject(object: Record<string, unknown>): string | null {
  if (typeof object.client_reference_id === "string" && isUuid(object.client_reference_id)) {
    return object.client_reference_id;
  }

  const metadata = object.metadata as Record<string, string> | undefined;
  const userId = metadata?.user_id ?? metadata?.supabase_user_id;
  if (typeof userId === "string" && isUuid(userId)) return userId;

  return null;
}

function subscriptionFromStripeEvent(event: StripeEvent): SubscriptionUpdate | null {
  const object = event.data.object;
  const stripeCustomerId = stripeCustomerIdFromObject(object);

  switch (event.type) {
    case "checkout.session.completed": {
      const userId = userIdFromStripeObject(object);
      if (!userId) return null;
      return {
        subscription_tier: "premium",
        subscription_status: "active",
        subscription_provider: "stripe",
        subscription_expires_at: null,
        stripe_customer_id: stripeCustomerId,
      };
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const userId = userIdFromStripeObject(object);
      if (!userId) return null;

      const status = stripeStatusFromSubscription(
        typeof object.status === "string" ? object.status : undefined
      );
      const isPremium = status === "active" || status === "trialing";

      return {
        subscription_tier: isPremium ? "premium" : "free",
        subscription_status: status,
        subscription_provider: "stripe",
        subscription_expires_at:
          unixToIso(object.current_period_end) ?? unixToIso(object.cancel_at),
        stripe_customer_id: stripeCustomerId,
      };
    }
    case "invoice.payment_failed": {
      return {
        subscription_tier: "premium",
        subscription_status: "past_due",
        subscription_provider: "stripe",
        subscription_expires_at: unixToIso(object.period_end),
        stripe_customer_id: stripeCustomerId,
      };
    }
    case "invoice.paid":
    case "invoice.payment_succeeded": {
      const billingReason = object.billing_reason;
      if (billingReason === "subscription_create" || billingReason === "subscription_cycle") {
        return {
          subscription_tier: "premium",
          subscription_status: "active",
          subscription_provider: "stripe",
          subscription_expires_at: unixToIso(object.period_end),
          stripe_customer_id: stripeCustomerId,
        };
      }
      return null;
    }
    default:
      return null;
  }
}

async function resolveUserIdForStripeEvent(
  event: StripeEvent,
  update: SubscriptionUpdate
): Promise<string | null> {
  const object = event.data.object;
  const directUserId = userIdFromStripeObject(object);
  if (directUserId) return directUserId;

  const stripeCustomerId = update.stripe_customer_id;
  if (!stripeCustomerId) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!supabaseUrl || !serviceRoleKey) return null;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (error) {
    console.error("[subscription-webhook] customer lookup failed:", error.message);
    return null;
  }

  return data?.user_id ?? null;
}

async function upsertSubscription(
  userId: string,
  update: SubscriptionUpdate
): Promise<Response> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[subscription-webhook] Supabase service credentials missing");
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("user_subscriptions")
    .upsert({ user_id: userId, ...update }, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    console.error("[subscription-webhook] upsert failed:", error.message);
    return jsonResponse({ error: "Failed to update subscription" }, 500);
  }

  return jsonResponse({ ok: true, subscription: data });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const url = new URL(req.url);
  const providerParam = url.searchParams.get("provider")?.trim() as
    | SubscriptionProvider
    | undefined;
  const rawBody = await req.text();

  if (providerParam === "stripe") {
    const stripeSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")?.trim();
    const stripeSignature = req.headers.get("stripe-signature")?.trim();

    if (!stripeSecret) {
      return jsonResponse(
        {
          error: "Stripe webhook not configured",
          hint: "Set STRIPE_WEBHOOK_SECRET in Supabase project secrets.",
        },
        503
      );
    }

    if (!stripeSignature) {
      return jsonResponse({ error: "Missing stripe-signature header" }, 400);
    }

    const valid = await verifyStripeSignature(rawBody, stripeSignature, stripeSecret);
    if (!valid) {
      return jsonResponse({ error: "Invalid Stripe signature" }, 401);
    }

    let event: StripeEvent;
    try {
      event = JSON.parse(rawBody) as StripeEvent;
    } catch {
      return jsonResponse({ error: "Invalid Stripe event JSON" }, 400);
    }

    const update = subscriptionFromStripeEvent(event);
    if (!update) {
      return jsonResponse({ ok: true, ignored: true, type: event.type });
    }

    const userId = await resolveUserIdForStripeEvent(event, update);
    if (!userId || !isUuid(userId)) {
      return jsonResponse({ error: "Stripe event missing valid user_id metadata" }, 400);
    }

    return upsertSubscription(userId, update);
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

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!payload.user_id || !isUuid(payload.user_id)) {
    return jsonResponse({ error: "user_id must be a valid UUID" }, 400);
  }

  const update: SubscriptionUpdate = {
    subscription_tier: payload.subscription_tier ?? "premium",
    subscription_status: payload.subscription_status ?? "active",
    subscription_provider: payload.subscription_provider ?? providerParam ?? "manual",
    subscription_expires_at: payload.subscription_expires_at ?? null,
  };

  return upsertSubscription(payload.user_id, update);
});
