import { Text, View } from "react-native";
import { AiCompanionPanel } from "./AiCompanionPanel";
import { AiInsightsPanel } from "./AiInsightsPanel";
import { LoadingState } from "./LoadingState";
import { PlusInsightsPanel } from "./PlusInsightsPanel";
import { PremiumFeatureLock } from "./PremiumFeatureLock";
import { ReadingActivityPanel } from "./ReadingActivityPanel";
import { SectionCard } from "./SectionCard";
import { useSubscription } from "../hooks/useSubscription";
import { useAuthStore } from "../store/authStore";

export function ReadingInsightsSection() {
  const userId = useAuthStore((s) => s.user?.id);
  const { canAccess, isPremium, loading: subscriptionLoading } = useSubscription();
  const hasAdvancedAnalytics = canAccess("advanced_analytics");
  const hasAiInsights = canAccess("ai_insights");

  return (
    <View className="gap-4">
      <SectionCard title="Activity" emoji="📊">
        {subscriptionLoading ? (
          <LoadingState message="Checking subscription…" />
        ) : hasAdvancedAnalytics ? (
          userId ? (
            <View className="gap-6">
              <ReadingActivityPanel userId={userId} />
              <PlusInsightsPanel userId={userId} />
            </View>
          ) : (
            <Text className="text-sm text-ink-muted">Sign in to view reading activity.</Text>
          )
        ) : (
          <PremiumFeatureLock
            compact
            title="Advanced reading analytics"
            description="Unlock reading heatmaps, pace trends, and weekly activity charts with Bookmarked Plus."
          />
        )}
      </SectionCard>

      <SectionCard title="AI Insights">
        {subscriptionLoading ? (
          <LoadingState message="Checking subscription…" />
        ) : hasAiInsights ? (
          userId ? (
            <View className="gap-6">
              <AiInsightsPanel userId={userId} />
              <AiCompanionPanel />
            </View>
          ) : (
            <Text className="text-sm text-ink-muted">Sign in to view AI insights.</Text>
          )
        ) : (
          <PremiumFeatureLock
            compact
            title="AI reading insights"
            description="Get personalized reflections and reading patterns powered by your trail."
          />
        )}
      </SectionCard>

      {isPremium ? null : (
        <Text className="text-center text-xs text-ink-muted">
          Plus unlocks advanced analytics and AI insights on web and mobile.
        </Text>
      )}
    </View>
  );
}
