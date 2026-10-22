import { Platform, Text, View } from "react-native";
import { env } from "../constants/env";
import { useAppleSubscriptionPurchase } from "../hooks/useAppleSubscriptionPurchase";
import { Button } from "./Button";

type Props = {
  userId: string;
  onSubscriptionUpdated: () => void;
};

export function PremiumUpgradeActions({ userId, onSubscriptionUpdated }: Props) {
  const purchase = useAppleSubscriptionPurchase({
    userId,
    onVerified: onSubscriptionUpdated,
  });

  return (
    <View className="mt-6 gap-3">
      {purchase.iapEnabled ? (
        <>
          <Button
            title={`Subscribe monthly — ${purchase.monthlyPrice}`}
            onPress={() => void purchase.subscribe(purchase.monthlySku)}
            disabled={!purchase.connected || purchase.busy}
            loading={purchase.purchasing || purchase.verifying}
          />
          <Button
            title={`Subscribe yearly — ${purchase.yearlyPrice}`}
            onPress={() => void purchase.subscribe(purchase.yearlySku)}
            disabled={!purchase.connected || purchase.busy}
            loading={purchase.purchasing || purchase.verifying}
          />
          <Button
            title={`Home monthly — ${purchase.homeMonthlyPrice}`}
            variant="secondary"
            onPress={() => void purchase.subscribe(purchase.homeMonthlySku)}
            disabled={!purchase.connected || purchase.busy}
          />
          <Button
            title={`Home yearly — ${purchase.homeYearlyPrice}`}
            variant="secondary"
            onPress={() => void purchase.subscribe(purchase.homeYearlySku)}
            disabled={!purchase.connected || purchase.busy}
          />
          <Button
            title="Restore purchases"
            variant="ghost"
            loading={purchase.restoring}
            onPress={() => void purchase.restore()}
            disabled={!purchase.connected || purchase.busy}
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

      {purchase.error ? (
        <Text className="text-center text-sm text-red-600">{purchase.error}</Text>
      ) : null}
    </View>
  );
}
