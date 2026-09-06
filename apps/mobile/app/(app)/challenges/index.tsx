import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { useRouter } from "expo-router";
import { FeatureLimitModal } from "../../../src/components/FeatureLimitModal";
import { LoadingState } from "../../../src/components/LoadingState";
import { ScreenHeader } from "../../../src/components/ScreenHeader";
import { EmptyState } from "../../../src/components/EmptyState";
import {
  listChallengeCatalog,
  type ChallengeCardModel,
} from "../../../src/services/challenges/ChallengeService";
import { useSubscription } from "../../../src/hooks/useSubscription";
import { challengeCardColumns, formatChallengeAmount } from "../../../../../packages/utils/challengeDisplay";
import { IOS_SUBSCRIBE_COPY } from "../../../../../packages/utils/subscription";
import { TAB_BAR_SPACE } from "../../../src/navigation/TabBarScroll";
import Animated from "react-native-reanimated";
import { useTabBarScroll } from "../../../src/navigation/TabBarScroll";

export default function ChallengesRoute() {
  const router = useRouter();
  const { isPremium } = useSubscription();
  const { width } = useWindowDimensions();
  const columns = challengeCardColumns(width);
  const { onScroll } = useTabBarScroll();
  const [catalog, setCatalog] = useState<{
    featured: ChallengeCardModel[];
    yours: ChallengeCardModel[];
    completed: ChallengeCardModel[];
  } | null>(null);
  const [limitOpen, setLimitOpen] = useState(false);

  const load = useCallback(async () => {
    setCatalog(await listChallengeCatalog());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sections = useMemo(
    () =>
      catalog
        ? [
            { title: "Featured", empty: "No featured challenges right now.", cards: catalog.featured },
            { title: "Your Challenges", empty: "You have not joined a challenge yet.", cards: catalog.yours },
            { title: "Completed", empty: "Finished challenges will land here.", cards: catalog.completed },
          ]
        : [],
    [catalog]
  );

  if (!catalog) return <LoadingState message="Loading challenges…" />;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Challenges" fallbackHref="/profile" />
      <FeatureLimitModal
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        featureLabel="Create a challenge"
        limitMessage="Creating reading challenges is a Bookmarked Plus feature. Subscribe in this app."
      />
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE }}
      >
        <Pressable
          className="mb-4 self-start rounded-full bg-primary px-4 py-2"
          onPress={() => {
            if (isPremium) router.push("/challenges/create");
            else setLimitOpen(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Create Challenge"
        >
          <Text className="font-semibold text-on-primary">Create Challenge</Text>
        </Pressable>
        {!isPremium ? (
          <View className="mb-4 rounded-2xl border border-brand-border bg-surface p-4">
            <Text className="font-semibold text-puce-red">{IOS_SUBSCRIBE_COPY.headline}</Text>
            <Text className="mt-1 text-sm text-ink-muted">{IOS_SUBSCRIBE_COPY.body}</Text>
          </View>
        ) : null}
        {sections.map((section) => (
          <View key={section.title} className="mb-6">
            <Text className="mb-2 text-xl font-semibold text-puce-red">{section.title}</Text>
            {section.cards.length === 0 ? (
              <EmptyState title={section.empty} description="" />
            ) : (
              <View className={columns === 2 ? "flex-row flex-wrap justify-between" : undefined}>
                {section.cards.map((card) => (
                  <Pressable
                    key={card.challenge.id}
                    className="mb-3 rounded-2xl border border-brand-border bg-surface p-4"
                    style={columns === 2 ? { width: "48%" } : undefined}
                    onPress={() => router.push(`/challenges/${card.challenge.id}?origin=challenges`)}
                    accessibilityRole="button"
                    accessibilityLabel={`View ${card.challenge.title}`}
                  >
                    <Text className="font-semibold text-puce-red">{card.challenge.title}</Text>
                    {card.progress ? (
                      <Text className="mt-1 text-xs text-ink-muted">
                        {formatChallengeAmount(card.progress.current, card.progress.unit)} · {card.progress.percent}%
                      </Text>
                    ) : null}
                    {card.completed ? (
                      <Text className="mt-1 text-xs font-medium text-puce-red">Completed</Text>
                    ) : card.timeRemaining ? (
                      <Text className="mt-1 text-xs text-ink-muted">{card.timeRemaining}</Text>
                    ) : null}
                    <Text className="mt-2 text-sm font-medium text-primary">View</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ))}
      </Animated.ScrollView>
    </View>
  );
}
