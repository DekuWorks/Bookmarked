import Constants from "expo-constants";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { ErrorCode, useIAP, type Purchase } from "expo-iap";
import { canStartPlusPurchase } from "../../../../packages/utils/iap";
import {
  IAP_HOME_PRICE_LABEL,
  IAP_HOME_YEARLY_PRICE_LABEL,
  IAP_PREMIUM_PRICE_LABEL,
  IAP_PREMIUM_YEARLY_PRICE_LABEL,
} from "../../../../packages/utils/iap";
import {
  APPLE_HOME_PRODUCT_ID,
  APPLE_HOME_YEARLY_PRODUCT_ID,
  APPLE_PREMIUM_PRODUCT_ID,
  APPLE_PREMIUM_PRODUCT_IDS,
  APPLE_PREMIUM_YEARLY_PRODUCT_ID,
} from "../constants/iap";
import { verifyApplePurchaseOnServer } from "../services/iap";

type Options = {
  userId: string | undefined;
  /** Called only after the server accepts the Apple transaction. */
  onVerified: () => void;
};

function isNativeIosStoreBuild(): boolean {
  return Platform.OS === "ios" && Constants.appOwnership !== "expo";
}

function isCancelled(code: unknown): boolean {
  return code === ErrorCode.UserCancelled;
}

function isPending(code: unknown, message: string): boolean {
  const normalized = `${String(code ?? "")} ${message}`.toLowerCase();
  return normalized.includes("pending") || normalized.includes("deferred");
}

export function useAppleSubscriptionPurchase({ userId, onVerified }: Options) {
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const iapEnabled = isNativeIosStoreBuild();
  const finishTransactionRef = useRef<
    (args: { purchase: Purchase; isConsumable?: boolean }) => Promise<void>
  >(async () => undefined);
  const onVerifiedRef = useRef(onVerified);
  onVerifiedRef.current = onVerified;

  const handlePurchaseSuccess = useCallback(async (purchase: Purchase) => {
    setError(null);
    setVerifying(true);
    try {
      const result = await verifyApplePurchaseOnServer(purchase);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await finishTransactionRef.current({ purchase, isConsumable: false });
      onVerifiedRef.current();
    } finally {
      setVerifying(false);
    }
  }, []);

  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    finishTransaction,
    restorePurchases,
  } = useIAP({
    onPurchaseSuccess: (purchase) => {
      void handlePurchaseSuccess(purchase);
    },
    onPurchaseError: (purchaseError) => {
      if (isCancelled(purchaseError.code)) return;
      if (isPending(purchaseError.code, purchaseError.message)) {
        setError("Purchase is pending with Apple. Plus unlocks after Apple confirms it.");
        return;
      }
      setError(purchaseError.message);
    },
    onError: (hookError) => {
      setError(hookError.message);
    },
  });

  finishTransactionRef.current = finishTransaction;

  useEffect(() => {
    if (!iapEnabled || !connected) return;
    void fetchProducts({ skus: [...APPLE_PREMIUM_PRODUCT_IDS], type: "subs" });
  }, [connected, fetchProducts, iapEnabled]);

  const listedPrice = useCallback(
    (sku: string) => subscriptions.find((item) => item.id === sku)?.displayPrice ?? null,
    [subscriptions]
  );

  const monthlyListed = listedPrice(APPLE_PREMIUM_PRODUCT_ID) != null;
  const yearlyListed = listedPrice(APPLE_PREMIUM_YEARLY_PRODUCT_ID) != null;
  const monthlyPrice = listedPrice(APPLE_PREMIUM_PRODUCT_ID) ?? IAP_PREMIUM_PRICE_LABEL;
  const yearlyPrice = listedPrice(APPLE_PREMIUM_YEARLY_PRODUCT_ID) ?? IAP_PREMIUM_YEARLY_PRICE_LABEL;
  const homeMonthlyPrice = listedPrice(APPLE_HOME_PRODUCT_ID) ?? IAP_HOME_PRICE_LABEL;
  const homeYearlyPrice = listedPrice(APPLE_HOME_YEARLY_PRODUCT_ID) ?? IAP_HOME_YEARLY_PRICE_LABEL;

  const subscribe = useCallback(
    async (sku: string, options?: { requireListed?: boolean }) => {
      if (!iapEnabled) {
        setError("In-app purchases require a development or App Store build (not Expo Go).");
        return;
      }
      if (!userId) {
        setError("You must be signed in.");
        return;
      }
      const productListed = subscriptions.some((item) => item.id === sku);
      if (
        options?.requireListed &&
        !canStartPlusPurchase({ iapEnabled, connected, productListed })
      ) {
        setError(
          connected
            ? "Bookmarked Plus is not available from the App Store right now."
            : "The App Store is not available right now."
        );
        return;
      }
      setError(null);
      setPurchasing(true);
      try {
        await requestPurchase({
          type: "subs",
          request: {
            apple: {
              sku,
              appAccountToken: userId,
            },
          },
        });
      } catch (purchaseError) {
        const message =
          purchaseError instanceof Error
            ? purchaseError.message
            : "Could not start purchase. Please try again.";
        setError(message);
      } finally {
        setPurchasing(false);
      }
    },
    [connected, iapEnabled, requestPurchase, subscriptions, userId]
  );

  const restore = useCallback(async () => {
    if (!iapEnabled) {
      setError("In-app purchases require a development or App Store build (not Expo Go).");
      return;
    }
    setError(null);
    setRestoring(true);
    try {
      await restorePurchases();
      await new Promise((resolve) => setTimeout(resolve, 750));
      onVerifiedRef.current();
    } catch (restoreError) {
      const message =
        restoreError instanceof Error
          ? restoreError.message
          : "Could not restore purchases. Please try again.";
      setError(message);
    } finally {
      setRestoring(false);
    }
  }, [iapEnabled, restorePurchases]);

  return {
    iapEnabled,
    connected,
    error,
    restoring,
    purchasing,
    verifying,
    busy: purchasing || restoring || verifying,
    monthlyListed,
    yearlyListed,
    monthlyPrice,
    yearlyPrice,
    homeMonthlyPrice,
    homeYearlyPrice,
    monthlySku: APPLE_PREMIUM_PRODUCT_ID,
    yearlySku: APPLE_PREMIUM_YEARLY_PRODUCT_ID,
    homeMonthlySku: APPLE_HOME_PRODUCT_ID,
    homeYearlySku: APPLE_HOME_YEARLY_PRODUCT_ID,
    subscribe,
    restore,
  };
}
