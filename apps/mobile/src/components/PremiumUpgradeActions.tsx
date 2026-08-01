import Constants from "expo-constants";
import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Platform, Text, View } from "react-native";
import { ErrorCode, useIAP, type Purchase } from "expo-iap";
import {
  IAP_PREMIUM_PRICE_LABEL,
} from "../../../../packages/utils/iap";
import { APPLE_PREMIUM_PRODUCT_ID } from "../constants/iap";
import { env, webAuthRedirect } from "../constants/env";
import { verifyApplePurchaseOnServer } from "../services/iap";
import { Button } from "./Button";

type Props = {
  userId: string;
  onSubscriptionUpdated: () => void;
};

const WEB_UPGRADE_URL = webAuthRedirect("/upgrade");

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
    void fetchProducts({ skus: [APPLE_PREMIUM_PRODUCT_ID], type: "subs" });
  }, [connected, fetchProducts, iapEnabled]);

  const localizedPrice =
    subscriptions.find((item) => item.id === APPLE_PREMIUM_PRODUCT_ID)?.displayPrice ??
    IAP_PREMIUM_PRICE_LABEL;

  const handleSubscribe = useCallback(async () => {
    if (!iapEnabled) return;
    setError(null);

    try {
      await requestPurchase({
        type: "subs",
        request: {
          apple: {
            sku: APPLE_PREMIUM_PRODUCT_ID,
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
      await restorePurchases();
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

  const handleSubscribeOnWeb = useCallback(() => {
    void Linking.openURL(WEB_UPGRADE_URL);
  }, []);

  return (
    <View className="mt-6 gap-3">
      {iapEnabled ? (
        <>
          <Button
            title={`Subscribe to Plus with App Store — ${localizedPrice}`}
            onPress={() => void handleSubscribe()}
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
            : "Android billing uses the web checkout for now."}
        </Text>
      )}

      <Button
        title="Subscribe to Plus on web (Stripe)"
        variant="secondary"
        onPress={handleSubscribeOnWeb}
      />
      <Text className="text-center text-xs leading-5 text-ink-muted">
        One Bookmarked Plus membership works across {env.siteUrl.replace(/^https?:\/\//, "")} and the mobile
        app.
      </Text>

      {error ? <Text className="text-center text-sm text-red-600">{error}</Text> : null}
    </View>
  );
}
