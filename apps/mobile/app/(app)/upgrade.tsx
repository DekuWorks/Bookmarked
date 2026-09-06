import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, ScrollView, Text, View } from "react-native";
import { Button } from "../../src/components/Button";
import { LoadingState } from "../../src/components/LoadingState";
import { PlusBadge } from "../../src/components/PlusBadge";
import { PremiumFeatureList } from "../../src/components/PremiumFeatureList";
import { PremiumFeatureLock } from "../../src/components/PremiumFeatureLock";
import { PremiumUpgradeActions } from "../../src/components/PremiumUpgradeActions";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { SubscriptionComparison } from "../../src/components/SubscriptionComparison";
import { useSubscription } from "../../src/hooks/useSubscription";
import { useSubscriptionActivationPoll } from "../../src/hooks/useSubscriptionActivationPoll";
import { createBillingPortalSession } from "../../src/services/stripePortal";
import { useAuthStore } from "../../src/store/authStore";
import { TAB_BAR_SPACE } from "../../src/navigation/TabBarScroll";

const APPLE_SUBSCRIPTIONS_URL = "https://apps.apple.com/account/subscriptions";

export default function UpgradeRoute() {
  const router = useRouter();
  const { checkout } = useLocalSearchParams<{ checkout?: string }>();
  const userId = useAuthStore((s) => s.user?.id);
  const { subscription, isPremium, loading, refetch } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const checkoutStatus = typeof checkout === "string" ? checkout : undefined;
  const checkoutSucceeded = checkoutStatus === "success";

  const { activating, timedOut } = useSubscriptionActivationPoll({
    enabled: checkoutSucceeded && Boolean(userId),
    isPremium,
    refetch,
  });

  const optimisticSubscribed = checkoutSucceeded && timedOut && !isPremium;
  const showSubscribedUI = isPremium || optimisticSubscribed;
  const awaitingActivation = checkoutSucceeded && !showSubscribedUI;

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  const handleManageStripe = useCallback(async () => {
    setPortalError(null);
    setPortalLoading(true);

    try {
      const result = await createBillingPortalSession();
      if (result.ok) {
        await Linking.openURL(result.url);
        return;
      }

      setPortalError(result.error);
    } catch (error) {
      setPortalError(
        error instanceof Error ? error.message : "Could not open billing portal. Please try again."
      );
    } finally {
      setPortalLoading(false);
    }
  }, []);

  const handleManageApple = useCallback(() => {
    void Linking.openURL(APPLE_SUBSCRIPTIONS_URL);
  }, []);

  if (loading && !awaitingActivation) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Bookmarked Membership" />
        <LoadingState message="Loading plans…" />
      </View>
    );
  }

  const showStripeManage =
    subscription?.subscription_provider === "stripe" && Boolean(subscription.stripe_customer_id);
  const showAppleManage = subscription?.subscription_provider === "apple";
  const showPricing = !showSubscribedUI && !awaitingActivation;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Bookmarked Membership" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE, gap: 16 }}>
        <Text className="text-center text-ink-muted">
          Free keeps the essentials. Bookmarked Plus unlocks reading intelligence; Bookmarked Home
          adds maps, matches, and concierge support across web and mobile.
        </Text>

        {awaitingActivation && activating ? (
          <View className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
            <Text className="text-center font-medium text-puce-red">Activating Bookmarked Plus…</Text>
            <Text className="mt-1 text-center text-sm text-ink-muted">
              Thanks for subscribing! We&apos;re unlocking your benefits now — this usually takes just
              a few seconds.
            </Text>
          </View>
        ) : null}

        {showSubscribedUI ? (
          <View className="rounded-2xl border border-primary/30 bg-primary/10 p-6">
            <View className="items-center">
              <PlusBadge compact />
              <Text className="mt-3 text-center text-lg font-semibold text-puce-red">
                You&apos;re subscribed
              </Text>
              <Text className="mt-2 text-center text-sm text-ink-muted">
                {optimisticSubscribed
                  ? "Payment received — your Premium benefits are unlocking and will sync across web and mobile shortly."
                  : "Thanks for supporting Bookmarked. Premium features are unlocked on your account."}
              </Text>
            </View>

            <PremiumFeatureList />

            <View className="mt-4 gap-2">
              <Button title="Open Reading Room" variant="ghost" onPress={() => router.push("/")} />
              {showStripeManage ? (
                <Button
                  title="Manage subscription"
                  variant="secondary"
                  loading={portalLoading}
                  onPress={() => void handleManageStripe()}
                />
              ) : null}
              {showAppleManage ? (
                <Button
                  title="Manage subscription"
                  variant="secondary"
                  onPress={handleManageApple}
                />
              ) : null}
            </View>
            {portalError ? (
              <Text className="mt-3 text-center text-sm text-red-600">{portalError}</Text>
            ) : null}
            {showAppleManage ? (
              <Text className="mt-3 text-center text-xs text-ink-muted">
                Opens App Store subscription settings.
              </Text>
            ) : null}
          </View>
        ) : showPricing ? (
          <View className="rounded-2xl border border-brand-border bg-surface p-6">
            <Text className="text-center text-sm font-medium uppercase tracking-wide text-primary">
              Bookmarked Plus
            </Text>
            <Text className="mt-2 text-center text-lg font-semibold text-puce-red">
              Subscribe with Apple
            </Text>
            <Text className="mt-1 text-center text-sm text-ink-muted">
              Price is shown by the App Store. Cancel anytime in iOS Settings.
            </Text>

            <View className="mt-6">
              <SubscriptionComparison />
            </View>

            <PremiumFeatureList />

            {userId ? (
              <PremiumUpgradeActions userId={userId} onSubscriptionUpdated={() => void refetch()} />
            ) : (
              <Text className="mt-6 text-center text-sm text-ink-muted">
                Sign in to subscribe.
              </Text>
            )}
          </View>
        ) : null}

        {!showSubscribedUI && !awaitingActivation ? (
          <PremiumFeatureLock
            compact
            title="Preview membership benefits"
            description="Plus unlocks reading intelligence and a full Reading DNA dashboard; Home adds maps and reader matching."
          />
        ) : null}
      </ScrollView>
    </View>
  );
}
