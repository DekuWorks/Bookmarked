import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { Button } from "../../src/components/Button";
import { LoadingState } from "../../src/components/LoadingState";
import { PremiumFeatureLock } from "../../src/components/PremiumFeatureLock";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { useSubscription } from "../../src/hooks/useSubscription";

const PREMIUM_FEATURES = [
  {
    title: "Advanced analytics",
    description: "Reading heatmaps, pace trends, and deeper stats in your Reading Room.",
  },
  {
    title: "AI reading insights",
    description: "Personalized recommendations and reflection prompts based on your journal.",
  },
  {
    title: "Early access",
    description: "Try new community and library features before they roll out to everyone.",
  },
] as const;

export default function UpgradeRoute() {
  const router = useRouter();
  const { isPremium, loading } = useSubscription();

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Bookmarked Premium" />
        <LoadingState message="Loading plans…" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Bookmarked Premium" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 16 }}>
        <Text className="text-center text-ink-muted">
          Go deeper with your reading life — analytics, insights, and early access to what&apos;s
          next.
        </Text>

        {isPremium ? (
          <View className="rounded-2xl border border-primary/30 bg-primary/10 p-6">
            <Text className="text-center text-lg font-semibold text-puce-red">
              You&apos;re on Premium
            </Text>
            <Text className="mt-2 text-center text-sm text-ink-muted">
              Thanks for supporting Bookmarked. Premium features are unlocked on your account.
            </Text>
            <View className="mt-4">
              <Button title="Back to Reading Room" variant="ghost" onPress={() => router.back()} />
            </View>
          </View>
        ) : (
          <View className="rounded-2xl border border-brand-border bg-surface p-6">
            <Text className="text-center text-sm font-medium uppercase tracking-wide text-primary">
              Coming soon
            </Text>
            <Text className="mt-2 text-center text-3xl font-bold text-puce-red">$4.99 / month</Text>
            <Text className="mt-1 text-center text-sm text-ink-muted">
              Billed monthly. Cancel anytime.
            </Text>

            <View className="mt-6 gap-3">
              {PREMIUM_FEATURES.map((feature) => (
                <View
                  key={feature.title}
                  className="rounded-xl border border-brand-border bg-background/60 px-4 py-3"
                >
                  <Text className="font-semibold text-puce-red">{feature.title}</Text>
                  <Text className="mt-1 text-sm text-ink-muted">{feature.description}</Text>
                </View>
              ))}
            </View>

            <Text className="mt-6 text-center text-sm text-ink-muted">
              In-app purchases are not live yet. Premium gates are in place so we can launch
              billing without another app release.
            </Text>
          </View>
        )}

        {!isPremium ? (
          <PremiumFeatureLock
            compact
            title="Preview what Premium unlocks"
            description="Advanced analytics and AI insights are already wired behind Premium gates in your Reading Room."
          />
        ) : null}
      </ScrollView>
    </View>
  );
}
