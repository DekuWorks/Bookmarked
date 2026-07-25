/**
 * Verifies an App Store subscription purchase and updates user_subscriptions.
 *
 * Requires Authorization: Bearer <user JWT>.
 *
 * Secrets:
 * - APPLE_BUNDLE_ID — expected iOS bundle id (default: com.dekuworks.bookmarked)
 * - APPLE_PREMIUM_PRODUCT_IDS — comma-separated SKUs (default: com.dekuworks.bookmarked.premium.monthly)
 *
 * Production hardening: JWS signatures are verified against Apple's x5c chain.
 * Optional App Store Server API transaction lookup can still be layered on top.
 * See docs/APP_STORE_IAP.md.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  AppleJwsVerificationError,
  verifyAppleJws,
} from "../_shared/apple-jws.ts";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_PRODUCT_IDS = ["com.dekuworks.bookmarked.premium.monthly"];
const DEFAULT_BUNDLE_ID = "com.dekuworks.bookmarked";

type VerifyPayload = {
  transaction_id?: string;
  product_id?: string;
  purchase_token?: string | null;
  original_transaction_id?: string | null;
  expires_at?: string | null;
};

type StoreKitTransactionPayload = {
  transactionId?: string;
  originalTransactionId?: string;
  bundleId?: string;
  productId?: string;
  expiresDate?: number;
  appAccountToken?: string;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function expectedBundleId(): string {
  return Deno.env.get("APPLE_BUNDLE_ID")?.trim() || DEFAULT_BUNDLE_ID;
}

function allowedProductIds(): string[] {
  const raw = Deno.env.get("APPLE_PREMIUM_PRODUCT_IDS")?.trim();
  if (!raw) return DEFAULT_PRODUCT_IDS;
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function originalTransactionIdFromPayload(
  payload: VerifyPayload,
  transaction: StoreKitTransactionPayload
): string | null {
  if (
    typeof transaction.originalTransactionId === "string" &&
    transaction.originalTransactionId.length > 0
  ) {
    return transaction.originalTransactionId;
  }

  if (payload.original_transaction_id?.trim()) {
    return payload.original_transaction_id.trim();
  }

  return null;
}

function validateTransactionPayload(params: {
  transaction: StoreKitTransactionPayload;
  request: VerifyPayload;
  userId: string;
  allowedProducts: string[];
}): { expiresAt: string; originalTransactionId: string } | Response {
  const { transaction, request, userId, allowedProducts } = params;

  if (transaction.bundleId !== expectedBundleId()) {
    return jsonResponse({ error: "Purchase bundle id does not match this app" }, 400);
  }

  if (!transaction.productId || !allowedProducts.includes(transaction.productId)) {
    return jsonResponse({ error: "Unknown subscription product" }, 400);
  }

  if (request.product_id?.trim() !== transaction.productId) {
    return jsonResponse({ error: "Purchase product does not match request" }, 400);
  }

  if (
    request.transaction_id?.trim() &&
    transaction.transactionId &&
    request.transaction_id.trim() !== transaction.transactionId
  ) {
    return jsonResponse({ error: "Purchase transaction does not match request" }, 400);
  }

  if (
    transaction.appAccountToken &&
    transaction.appAccountToken.toLowerCase() !== userId.toLowerCase()
  ) {
    return jsonResponse({ error: "Purchase account token does not match user" }, 400);
  }

  if (typeof transaction.expiresDate !== "number" || !Number.isFinite(transaction.expiresDate)) {
    return jsonResponse({ error: "Purchase token is missing subscription expiry" }, 400);
  }

  if (transaction.expiresDate <= Date.now()) {
    return jsonResponse({ error: "Subscription purchase is expired" }, 400);
  }

  const originalTransactionId = originalTransactionIdFromPayload(request, transaction);
  if (!originalTransactionId) {
    return jsonResponse({ error: "Purchase token is missing original transaction id" }, 400);
  }

  return {
    expiresAt: new Date(transaction.expiresDate).toISOString(),
    originalTransactionId,
  };
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
        error: "Purchase token is required for verification",
      },
      503
    );
  }

  let transaction: StoreKitTransactionPayload;
  try {
    const verified = await verifyAppleJws<StoreKitTransactionPayload>(purchaseToken);
    transaction = verified.payload;
  } catch (verificationError) {
    const message =
      verificationError instanceof AppleJwsVerificationError
        ? verificationError.message
        : "Purchase verification failed";
    return jsonResponse({ error: message }, 401);
  }

  const validation = validateTransactionPayload({
    transaction,
    request: payload,
    userId: userData.user.id,
    allowedProducts: allowed,
  });
  if (validation instanceof Response) return validation;

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
        subscription_expires_at: validation.expiresAt,
        apple_original_transaction_id: validation.originalTransactionId,
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
    verified: true,
  });
});
