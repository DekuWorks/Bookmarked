import Constants from "expo-constants";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Text, View } from "react-native";
import { ErrorCode, useIAP, type Purchase } from "expo-iap";
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
import { env } from "../constants/env";
import { verifyApplePurchaseOnServer } from "../services/iap";
import { Button } from "./Button";

type Props = {
  userId: string;
  onSubscriptionUpdated: () => void;
};

function isNativeIosStoreBuild(): boolean {
  return Platform.OS === "ios" && Constants.appOwnership !== "expo";
}

export function PremiumUpgradeActions({ userId, onSubscriptionUpdated }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const iapEnabled = isNativeIosStoreBuild();
  const finishTransactionRef = useRef<
    (args: { purchase: Purchase; isConsumable?: boolean }) => Promise<void>
  >(async () => undefined);

  const handlePurchaseSuccess = useCallback(
    async (purchase: Purchase) => {
      setError(null);
      const result = await verifyApplePurchaseOnServer(purchase);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      await finishTransactionRef.current({ purchase, isConsumable: false });
      onSubscriptionUpdated();
    },
    [onSubscriptionUpdated]
  );

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
      if (purchaseError.code === ErrorCode.UserCancelled) return;
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

  const monthlyPrice =
    subscriptions.find((item) => item.id === APPLE_PREMIUM_PRODUCT_ID)?.displayPrice ??
    IAP_PREMIUM_PRICE_LABEL;
  const yearlyPrice =
    subscriptions.find((item) => item.id === APPLE_PREMIUM_YEARLY_PRODUCT_ID)?.displayPrice ??
    IAP_PREMIUM_YEARLY_PRICE_LABEL;
  const homeMonthlyPrice =
    subscriptions.find((item) => item.id === APPLE_HOME_PRODUCT_ID)?.displayPrice ??
    IAP_HOME_PRICE_LABEL;
  const homeYearlyPrice =
    subscriptions.find((item) => item.id === APPLE_HOME_YEARLY_PRODUCT_ID)?.displayPrice ??
    IAP_HOME_YEARLY_PRICE_LABEL;

  const handleSubscribe = useCallback(async (sku: string) => {
    if (!iapEnabled) return;
    setError(null);

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
    }
  }, [iapEnabled, requestPurchase, userId]);

  const handleRestore = useCallback(async () => {
    if (!iapEnabled) return;
    setError(null);
    setRestoring(true);

    try {
      // StoreKit restore delivers purchases via onPurchaseSuccess → apple-iap-verify.
      await restorePurchases();
      // Refresh server entitlement snapshot after verify callbacks settle.
      await new Promise((resolve) => setTimeout(resolve, 750));
      onSubscriptionUpdated();
    } catch (restoreError) {
      const message =
        restoreError instanceof Error
          ? restoreError.message
          : "Could not restore purchases. Please try again.";
      setError(message);
    } finally {
      setRestoring(false);
    }
  }, [iapEnabled, onSubscriptionUpdated, restorePurchases]);

  return (
    <View className="mt-6 gap-3">
      {iapEnabled ? (
        <>
          <Button
            title={`Subscribe monthly — ${monthlyPrice}`}
            onPress={() => void handleSubscribe(APPLE_PREMIUM_PRODUCT_ID)}
            disabled={!connected}
          />
          <Button
            title={`Subscribe yearly — ${yearlyPrice}`}
            onPress={() => void handleSubscribe(APPLE_PREMIUM_YEARLY_PRODUCT_ID)}
            disabled={!connected}
          />
          <Button
            title={`Home monthly — ${homeMonthlyPrice}`}
            variant="secondary"
            onPress={() => void handleSubscribe(APPLE_HOME_PRODUCT_ID)}
            disabled={!connected}
          />
          <Button
            title={`Home yearly — ${homeYearlyPrice}`}
            variant="secondary"
            onPress={() => void handleSubscribe(APPLE_HOME_YEARLY_PRODUCT_ID)}
            disabled={!connected}
          />
          <Button
            title="Restore purchases"
            variant="ghost"
            loading={restoring}
            onPress={() => void handleRestore()}
            disabled={!connected}
          />
          <Text className="text-center text-xs leading-5 text-ink-muted">
            Billed through your Apple ID. Manage or cancel in iOS Settings → Subscriptions.
          </Text>
        </>
      ) : (
        <Text className="text-center text-sm leading-5 text-ink-muted">
          {Platform.OS === "ios"
            ? "In-app purchases require a development or App Store build (not Expo Go)."
            : "Subscribe in the Bookmarked iOS app. Plus then unlocks on the website automatically."}
        </Text>
      )}

      <Text className="text-center text-xs leading-5 text-ink-muted">
        Subscribe only in the iOS app. Once Plus is active, it unlocks on{" "}
        {env.siteUrl.replace(/^https?:\/\//, "")} automatically — no second purchase.
      </Text>

      {error ? <Text className="text-center text-sm text-red-600">{error}</Text> : null}
    </View>
  );
}
