import { Text, View } from "react-native";
import { AiInsightsPanel } from "./AiInsightsPanel";
import { PremiumFeatureLock } from "./PremiumFeatureLock";
import { ReadingActivityPanel } from "./ReadingActivityPanel";
import { SectionCard } from "./SectionCard";
import { useSubscription } from "../hooks/useSubscription";
import { useAuthStore } from "../store/authStore";

export function ReadingInsightsSection() {
  const userId = useAuthStore((s) => s.user?.id);
  const { canAccess, isPremium } = useSubscription();
  const hasAdvancedAnalytics = canAccess("advanced_analytics");
  const hasAiInsights = canAccess("ai_insights");

  return (
    <View className="gap-4">
      <SectionCard title="Reading insights" emoji="📊">
        <View className="gap-4">
          {hasAdvancedAnalytics ? (
            userId ? (
              <ReadingActivityPanel userId={userId} />
            ) : (
              <Text className="text-sm text-ink-muted">Sign in to view reading activity.</Text>
            )
          ) : (
            <PremiumFeatureLock
              compact
              title="Unlock advanced analytics"
              description="See reading heatmaps, pace trends, and deeper stats in your Reading Room."
            />
          )}

          {hasAiInsights ? (
            userId ? (
              <AiInsightsPanel userId={userId} />
            ) : (
              <Text className="text-sm text-ink-muted">Sign in to view AI insights.</Text>
            )
          ) : (
            <PremiumFeatureLock
              compact
              title="Unlock AI reading insights"
              description="Get personalized highlights, patterns, and reflection prompts from your journal."
            />
          )}
        </View>
      </SectionCard>

      {isPremium ? null : (
        <Text className="text-center text-xs text-ink-muted">
          Premium unlocks analytics and AI insights on web and mobile.
        </Text>
      )}
    </View>
  );
}
