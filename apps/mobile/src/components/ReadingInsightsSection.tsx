import { Text, View } from "react-native";
import { STATS_PLUS_FEATURES } from "../../../../packages/utils/plusLockedCopy";
import { useAppleSubscriptionPurchase } from "../hooks/useAppleSubscriptionPurchase";
import { useSubscription } from "../hooks/useSubscription";
import { useAuthStore } from "../store/authStore";
import { AiCompanionPanel } from "./AiCompanionPanel";
import { AiInsightsPanel } from "./AiInsightsPanel";
import { PlusBadge } from "./PlusBadge";
import { PlusInsightsPanel } from "./PlusInsightsPanel";
import { PlusLockedFeature } from "./PlusLockedFeature";
import { ReadingActivityPanel } from "./ReadingActivityPanel";
import { SectionCard } from "./SectionCard";
import { StatsEnter } from "./StatsEnter";
import { StatsSectionSkeleton } from "./StatsSectionSkeleton";

function LockedPlusStats({
  userId,
  showAnalytics,
  showInsights,
  onVerified,
}: {
  userId: string | undefined;
  showAnalytics: boolean;
  showInsights: boolean;
  onVerified: () => void;
}) {
  const purchase = useAppleSubscriptionPurchase({ userId, onVerified });
  const purchaseControls = {
    iapEnabled: purchase.iapEnabled,
    connected: purchase.connected,
    busy: purchase.busy,
    error: purchase.error,
    monthlyListed: purchase.monthlyListed,
    yearlyListed: purchase.yearlyListed,
    monthlyPrice: purchase.monthlyPrice,
    yearlyPrice: purchase.yearlyPrice,
    monthlySku: purchase.monthlySku,
    yearlySku: purchase.yearlySku,
    onSubscribe: (sku: string) => {
      void purchase.subscribe(sku, { requireListed: true });
    },
    onRestore: () => {
      void purchase.restore();
    },
  };

  return (
    <>
      {showAnalytics ? (
        <StatsEnter index={2}>
          <PlusLockedFeature
            title={STATS_PLUS_FEATURES.analytics.title}
            description={STATS_PLUS_FEATURES.analytics.description}
            purchase={purchaseControls}
          />
        </StatsEnter>
      ) : null}
      {showInsights ? (
        <StatsEnter index={3}>
          <PlusLockedFeature
            title={STATS_PLUS_FEATURES.insights.title}
            description={STATS_PLUS_FEATURES.insights.description}
            purchase={purchaseControls}
          />
        </StatsEnter>
      ) : null}
    </>
  );
}

export function ReadingInsightsSection() {
  const userId = useAuthStore((s) => s.user?.id);
  const { canAccess, loading: subscriptionLoading, refetch } = useSubscription();
  const hasAdvancedAnalytics = canAccess("advanced_analytics");
  const hasAiInsights = canAccess("ai_insights");
  const showAnalyticsLock = !subscriptionLoading && !hasAdvancedAnalytics;
  const showInsightsLock = !subscriptionLoading && !hasAiInsights;

  return (
    <View className="gap-4">
      {subscriptionLoading ? (
        <StatsEnter index={2}>
          <SectionCard title={STATS_PLUS_FEATURES.analytics.title} icon={<PlusBadge compact />}>
            <StatsSectionSkeleton label="Checking subscription" />
          </SectionCard>
        </StatsEnter>
      ) : hasAdvancedAnalytics ? (
        <StatsEnter index={2}>
        <SectionCard title={STATS_PLUS_FEATURES.analytics.title} icon={<PlusBadge compact />}>
          {userId ? (
            <View className="gap-6">
              <ReadingActivityPanel userId={userId} />
              <PlusInsightsPanel userId={userId} />
            </View>
          ) : (
            <Text className="text-sm text-ink-muted">Sign in to view reading activity.</Text>
          )}
        </SectionCard>
        </StatsEnter>
      ) : null}

      {subscriptionLoading ? null : hasAiInsights ? (
        <StatsEnter index={3}>
        <SectionCard title={STATS_PLUS_FEATURES.insights.title} icon={<PlusBadge compact />}>
          {userId ? (
            <View className="gap-6">
              <AiInsightsPanel userId={userId} />
              <AiCompanionPanel />
            </View>
          ) : (
            <Text className="text-sm text-ink-muted">Sign in to view AI insights.</Text>
          )}
        </SectionCard>
        </StatsEnter>
      ) : null}

      {showAnalyticsLock || showInsightsLock ? (
        <LockedPlusStats
          userId={userId}
          showAnalytics={showAnalyticsLock}
          showInsights={showInsightsLock}
          onVerified={() => {
            void refetch();
          }}
        />
      ) : null}
    </View>
  );
}
