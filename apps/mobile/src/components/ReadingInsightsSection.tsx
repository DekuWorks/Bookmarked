import { Text, View } from "react-native";
import { PremiumFeatureLock } from "./PremiumFeatureLock";
import { SectionCard } from "./SectionCard";
import { useSubscription } from "../hooks/useSubscription";

export function ReadingInsightsSection() {
  const { canAccess, isPremium } = useSubscription();
  const hasAdvancedAnalytics = canAccess("advanced_analytics");
  const hasAiInsights = canAccess("ai_insights");

  return (
    <SectionCard title="Reading insights" emoji="📊">
      <View className="gap-4">
        {hasAdvancedAnalytics ? (
          <View className="rounded-xl border border-dashed border-brand-border bg-background/70 px-4 py-5">
            <Text className="text-center font-medium text-puce-red">Advanced analytics</Text>
            <Text className="mt-2 text-center text-sm text-ink-muted">
              Reading heatmaps and pace trends are available on the web Reading Room. Mobile
              analytics are coming soon.
            </Text>
          </View>
        ) : (
          <PremiumFeatureLock
            compact
            title="Unlock advanced analytics"
            description="See reading heatmaps, pace trends, and deeper stats in your Reading Room."
          />
        )}

        {hasAiInsights ? (
          <View className="rounded-xl border border-dashed border-brand-border bg-background/70 px-4 py-5">
            <Text className="text-center font-medium text-puce-red">AI insights</Text>
            <Text className="mt-2 text-center text-sm text-ink-muted">
              {isPremium
                ? "You have Premium access. Personalized reflections will appear here once AI insights launch."
                : "Personalized reading insights are on the way."}
            </Text>
          </View>
        ) : (
          <PremiumFeatureLock
            compact
            title="Unlock AI reading insights"
            description="Get personalized recommendations and reflection prompts based on your journal."
          />
        )}
      </View>
    </SectionCard>
  );
}
