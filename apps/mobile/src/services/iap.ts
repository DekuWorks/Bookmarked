import type { Purchase } from "expo-iap";
import { isAllowedPremiumSku } from "../../../../packages/utils/iap";
import { env } from "../constants/env";
import { supabase } from "./supabase";

export type VerifyApplePurchaseResult =
  | { ok: true }
  | { ok: false; error: string };

type VerifyApplePurchaseResponse = {
  ok?: boolean;
  error?: string;
};

export async function verifyApplePurchaseOnServer(
  purchase: Purchase
): Promise<VerifyApplePurchaseResult> {
  if (!isAllowedPremiumSku(purchase.productId)) {
    return { ok: false, error: "Unknown subscription product." };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { ok: false, error: "You must be signed in." };
  }

  const iosPurchase = purchase as Purchase & {
    originalTransactionIdentifierIOS?: string | null;
    expirationDateIOS?: number | null;
  };

  const expiresAt =
    typeof iosPurchase.expirationDateIOS === "number"
      ? new Date(iosPurchase.expirationDateIOS).toISOString()
      : null;

  const response = await fetch(`${env.supabaseUrl}/functions/v1/apple-iap-verify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: env.supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: purchase.productId,
      transaction_id: purchase.id,
      original_transaction_id: iosPurchase.originalTransactionIdentifierIOS ?? null,
      purchase_token: purchase.purchaseToken ?? null,
      expires_at: expiresAt,
    }),
  });

  const body = (await response.json().catch(() => null)) as VerifyApplePurchaseResponse | null;

  if (!response.ok || !body?.ok) {
    return { ok: false, error: body?.error ?? "Could not verify purchase. Please try again." };
  }

  return { ok: true };
}
