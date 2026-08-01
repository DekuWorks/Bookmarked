import { useCallback, useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../../src/components/Button";
import { EmptyState } from "../../src/components/EmptyState";
import { FeatureLimitModal } from "../../src/components/FeatureLimitModal";
import { LoadingState } from "../../src/components/LoadingState";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import {
  joinReadingChallenge,
  listActiveChallenges,
  type ReadingChallenge,
} from "../../src/services/readingChallenges";
import { isEntitlementLimitError } from "../../src/utils/subscription";
import { SANS_FONT, SANS_FONT_BOLD } from "../../src/constants/theme";
import { useThemeColors } from "../../src/store/themeStore";
import { TAB_BAR_SPACE } from "../../src/navigation/TabBarScroll";

export default function ChallengesRoute() {
  const router = useRouter();
  const colors = useThemeColors();
  const [challenges, setChallenges] = useState<ReadingChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [limitOpen, setLimitOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setChallenges(await listActiveChallenges());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleJoin(challengeId: string) {
    setJoiningId(challengeId);
    setMessage(null);
    const result = await joinReadingChallenge(challengeId);
    setJoiningId(null);
    if (result.error) {
      if (isEntitlementLimitError(result.error)) {
        setLimitOpen(true);
        return;
      }
      setMessage(result.error);
      return;
    }
    setMessage("Joined challenge!");
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Challenges" />
      <FeatureLimitModal
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        featureLabel="Reading challenges"
        limitMessage="Free members can join 3 reading challenges per year. Upgrade to Bookmarked Plus for unlimited challenges."
      />

      {loading ? (
        <LoadingState message="Loading challenges…" />
      ) : (
        <FlatList
          data={challenges}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE, flexGrow: 1 }}
          ListHeaderComponent={
            <View className="mb-4">
              <Text style={{ fontFamily: SANS_FONT, color: colors.inkMuted }}>
                Free members can join up to 3 challenges per calendar year.
              </Text>
              {message ? (
                <Text className="mt-2 text-sm text-puce-red" style={{ fontFamily: SANS_FONT_BOLD }}>
                  {message}
                </Text>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              title="No active challenges"
              description="When challenges are published they will show here. Join limits are already enforced."
            />
          }
          renderItem={({ item }) => (
            <View className="mb-3 rounded-2xl border border-brand-border bg-surface p-4">
              <Text className="text-lg font-semibold text-puce-red">{item.title}</Text>
              {item.description ? (
                <Text className="mt-1 text-sm text-ink-muted">{item.description}</Text>
              ) : null}
              <Text className="mt-1 text-xs text-ink-muted">{item.year}</Text>
              <View className="mt-3">
                <Button
                  title="Join"
                  loading={joiningId === item.id}
                  onPress={() => void handleJoin(item.id)}
                />
              </View>
            </View>
          )}
          ListFooterComponent={
            <View className="mt-2">
              <Button title="Back to profile" variant="ghost" onPress={() => router.push("/(app)/profile")} />
            </View>
          }
        />
      )}
    </View>
  );
}
