import { Platform } from "react-native";
import Constants from "expo-constants";
import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  isUserCancelledError,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type ProductSubscription,
  type Purchase,
} from "expo-iap";
import { APPLE_PREMIUM_PRODUCT_ID, APPLE_PREMIUM_PRODUCT_IDS } from "../constants/iap";
import { env } from "../constants/env";
import { supabase } from "./supabase";

export type IapPurchaseResult =
  | { ok: true }
  | { ok: false; error: string; unavailable?: boolean };

export function isNativeIapSupported(): boolean {
  return Platform.OS === "ios" && Constants.appOwnership !== "expo";
}

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function verifyApplePurchaseOnServer(purchase: Purchase): Promise<IapPurchaseResult> {
  const token = await getAccessToken();
  if (!token) {
    return { ok: false, error: "Sign in to complete your purchase." };
  }

  const iosPurchase = purchase as Purchase & {
    originalTransactionIdentifierIOS?: string | null;
    expirationDateIOS?: number | null;
  };

  const response = await fetch(`${env.supabaseUrl}/functions/v1/apple-iap-verify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: env.supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transaction_id: purchase.id,
      product_id: purchase.productId,
      purchase_token: purchase.purchaseToken ?? null,
      original_transaction_id: iosPurchase.originalTransactionIdentifierIOS ?? null,
      expires_at:
        typeof iosPurchase.expirationDateIOS === "number"
          ? new Date(iosPurchase.expirationDateIOS).toISOString()
          : null,
    }),
  });

  const body = (await response.json().catch(() => null)) as {
    error?: string;
    available?: boolean;
  } | null;

  if (response.status === 503 || body?.available === false) {
    return {
      ok: false,
      unavailable: true,
      error: body?.error ?? "In-app purchases are not configured yet.",
    };
  }

  if (!response.ok) {
    return { ok: false, error: body?.error ?? "Could not verify purchase." };
  }

  return { ok: true };
}

export async function connectIapStore(): Promise<void> {
  if (!isNativeIapSupported()) return;
  await initConnection();
}

export async function disconnectIapStore(): Promise<void> {
  if (!isNativeIapSupported()) return;
  await endConnection();
}

export async function loadPremiumSubscriptionProduct(): Promise<ProductSubscription | null> {
  if (!isNativeIapSupported()) return null;

  const products = await fetchProducts({
    skus: [...APPLE_PREMIUM_PRODUCT_IDS],
    type: "subs",
  });

  if (!products?.length) return null;

  const match = products.find((product) => product.id === APPLE_PREMIUM_PRODUCT_ID);
  return (match ?? products[0]) as ProductSubscription;
}

export async function purchasePremiumSubscription(userId?: string): Promise<void> {
  if (!isNativeIapSupported()) {
    throw new Error("In-app purchases are only available in the iOS app.");
  }

  await requestPurchase({
    type: "subs",
    request: {
      apple: {
        sku: APPLE_PREMIUM_PRODUCT_ID,
        ...(userId ? { appAccountToken: userId } : {}),
      },
    },
  });
}

export async function restorePremiumPurchases(): Promise<IapPurchaseResult> {
  if (!isNativeIapSupported()) {
    return { ok: false, error: "Restore is only available in the iOS app." };
  }

  const purchases = await getAvailablePurchases();
  const premium = purchases.filter((purchase) =>
    APPLE_PREMIUM_PRODUCT_IDS.includes(
      purchase.productId as (typeof APPLE_PREMIUM_PRODUCT_IDS)[number]
    )
  );

  if (premium.length === 0) {
    return { ok: false, error: "No active Premium subscription found for this Apple ID." };
  }

  for (const purchase of premium) {
    const result = await verifyApplePurchaseOnServer(purchase);
    if (!result.ok) return result;
    await finishTransaction({ purchase, isConsumable: false });
  }

  return { ok: true };
}

export type IapListenerCallbacks = {
  onSuccess: (purchase: Purchase) => void | Promise<void>;
  onError: (message: string) => void;
};

export function attachIapListeners(callbacks: IapListenerCallbacks): () => void {
  const successSub = purchaseUpdatedListener((purchase) => {
    void callbacks.onSuccess(purchase);
  });
  const errorSub = purchaseErrorListener((error) => {
    if (isUserCancelledError(error)) return;
    callbacks.onError(error.message || "Purchase failed.");
  });

  return () => {
    successSub.remove();
    errorSub.remove();
  };
}
