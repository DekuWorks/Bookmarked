/**
 * Verifies an App Store subscription purchase and updates user_subscriptions.
 *
 * Requires Authorization: Bearer <user JWT>.
 *
 * Secrets:
 * - APPLE_PREMIUM_PRODUCT_IDS — comma-separated SKUs (default: com.dekuworks.bookmarked.premium.monthly)
 *
 * Production: verify JWS with Apple App Store Server API + Server Notifications V2.
 * See docs/APP_STORE_IAP.md.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_PRODUCT_IDS = ["com.dekuworks.bookmarked.premium.monthly"];

type VerifyPayload = {
  transaction_id?: string;
  product_id?: string;
  purchase_token?: string | null;
  original_transaction_id?: string | null;
  expires_at?: string | null;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function allowedProductIds(): string[] {
  const raw = Deno.env.get("APPLE_PREMIUM_PRODUCT_IDS")?.trim();
  if (!raw) return DEFAULT_PRODUCT_IDS;
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function decodeJwsPayload(jws: string): Record<string, unknown> | null {
  const parts = jws.split(".");
  if (parts.length < 2) return null;

  try {
    const segment = parts[1];
    const padded = segment + "=".repeat((4 - (segment.length % 4)) % 4);
    const json = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function expiresAtFromJws(jws: string | null | undefined): string | null {
  if (!jws) return null;
  const payload = decodeJwsPayload(jws);
  if (!payload) return null;

  const expiresDate = payload.expiresDate;
  if (typeof expiresDate === "number" && Number.isFinite(expiresDate)) {
    return new Date(expiresDate).toISOString();
  }

  return null;
}

function originalTransactionIdFromPayload(payload: VerifyPayload): string | null {
  if (payload.original_transaction_id?.trim()) {
    return payload.original_transaction_id.trim();
  }

  const token = payload.purchase_token?.trim();
  if (!token) return null;

  const decoded = decodeJwsPayload(token);
  const fromJws = decoded?.originalTransactionId;
  return typeof fromJws === "string" && fromJws.length > 0 ? fromJws : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
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

  let payload: VerifyPayload;
  try {
    payload = (await req.json()) as VerifyPayload;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const transactionId = payload.transaction_id?.trim();
  const productId = payload.product_id?.trim();
  const purchaseToken = payload.purchase_token?.trim() || null;

  if (!transactionId || !productId) {
    return jsonResponse({ error: "transaction_id and product_id are required" }, 400);
  }

  const allowed = allowedProductIds();
  if (!allowed.includes(productId)) {
    return jsonResponse({ error: "Unknown subscription product" }, 400);
  }

  if (!purchaseToken) {
    return jsonResponse(
      {
        available: false,
        error: "Purchase verification is not fully configured",
        hint: "Set up Apple Server API verification — see docs/APP_STORE_IAP.md",
      },
      503
    );
  }

  const expiresAt =
    payload.expires_at?.trim() || expiresAtFromJws(purchaseToken) || null;

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("user_subscriptions")
    .upsert(
      {
        user_id: userData.user.id,
        subscription_tier: "premium",
        subscription_status: "active",
        subscription_provider: "apple",
        subscription_expires_at: expiresAt,
        apple_original_transaction_id:
          originalTransactionIdFromPayload(payload) ?? transactionId,
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();

  if (error) {
    console.error("[apple-iap-verify] upsert failed:", error.message);
    return jsonResponse({ error: "Failed to update subscription" }, 500);
  }

  return jsonResponse({
    ok: true,
    subscription: data,
    verified: false,
    hint: "JWS decoded without Apple cert chain verification — see docs/APP_STORE_IAP.md",
  });
});
