import { Pressable, Text, View } from "react-native";
import { canStartPlusPurchase } from "../../../../packages/utils/iap";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { Button } from "./Button";
import { PlusBadge } from "./PlusBadge";

type PurchaseControls = {
  iapEnabled: boolean;
  connected: boolean;
  busy: boolean;
  error: string | null;
  monthlyListed: boolean;
  yearlyListed: boolean;
  monthlyPrice: string;
  yearlyPrice: string;
  monthlySku: string;
  yearlySku: string;
  onSubscribe: (sku: string) => void;
  onRestore: () => void;
};

type Props = {
  title: string;
  description: string;
  purchase: PurchaseControls;
};

export function PlusLockedFeature({ title, description, purchase }: Props) {
  const reducedMotion = usePrefersReducedMotion();
  const monthlyReady = canStartPlusPurchase({
    iapEnabled: purchase.iapEnabled,
    connected: purchase.connected,
    productListed: purchase.monthlyListed,
  });
  const yearlyReady = canStartPlusPurchase({
    iapEnabled: purchase.iapEnabled,
    connected: purchase.connected,
    productListed: purchase.yearlyListed,
  });

  return (
    <Pressable
      accessible={false}
      onPress={() => undefined}
      style={({ pressed }) =>
        pressed && !reducedMotion ? { transform: [{ scale: 0.985 }], opacity: 0.94 } : undefined
      }
    >
    <View className="rounded-2xl border border-dashed border-primary/40 bg-surface p-4">
      <View className="flex-row flex-wrap items-center gap-2">
        <PlusBadge />
        <Text accessibilityRole="header" className="flex-shrink text-lg font-semibold text-puce-red">
          {title}
        </Text>
      </View>
      <Text className="mt-3 text-sm leading-5 text-ink-muted">{description}</Text>
      <View className="mt-4 gap-2">
        <Button
          title={purchase.monthlyListed ? `Subscribe — ${purchase.monthlyPrice}` : "Subscribe"}
          accessibilityLabel={
            purchase.monthlyListed
              ? `Subscribe to Bookmarked Plus, ${purchase.monthlyPrice}`
              : "Subscribe to Bookmarked Plus"
          }
          onPress={() => purchase.onSubscribe(purchase.monthlySku)}
          disabled={!monthlyReady}
          loading={purchase.busy}
        />
        <Button
          title={
            purchase.yearlyListed ? `Subscribe yearly — ${purchase.yearlyPrice}` : "Subscribe yearly"
          }
          accessibilityLabel={
            purchase.yearlyListed
              ? `Subscribe yearly to Bookmarked Plus, ${purchase.yearlyPrice}`
              : "Subscribe yearly to Bookmarked Plus"
          }
          variant="secondary"
          onPress={() => purchase.onSubscribe(purchase.yearlySku)}
          disabled={!yearlyReady}
          loading={purchase.busy}
        />
        <Button
          title="Restore purchases"
          variant="ghost"
          onPress={purchase.onRestore}
          disabled={!purchase.iapEnabled || !purchase.connected || purchase.busy}
        />
      </View>
      {!purchase.iapEnabled ? (
        <Text className="mt-3 text-center text-sm leading-5 text-ink-muted">
          In-app purchases require a development or App Store build (not Expo Go).
        </Text>
      ) : !purchase.connected ? (
        <Text className="mt-3 text-center text-sm leading-5 text-ink-muted">
          Connecting to the App Store…
        </Text>
      ) : !purchase.monthlyListed ? (
        <Text className="mt-3 text-center text-sm leading-5 text-ink-muted">
          Bookmarked Plus is not available from the App Store right now.
        </Text>
      ) : null}
      <Text className="mt-3 text-center text-xs leading-5 text-ink-muted">
        Billed through your Apple ID. Manage or cancel in iOS Settings → Subscriptions.
      </Text>
      {purchase.error ? (
        <Text className="mt-2 text-center text-sm text-red-600">{purchase.error}</Text>
      ) : null}
    </View>
    </Pressable>
  );
}
