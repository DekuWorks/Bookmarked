import { useCallback, useEffect, useState } from "react";
import { Text, View, Pressable } from "react-native";
import {
  getAiInsights,
  type AiInsightItem,
  type AiInsightsResult,
} from "../services/aiInsights";

type Props = {
  userId: string;
};

function InsightCard({ item }: { item: AiInsightItem }) {
  return (
    <View className="rounded-xl border border-brand-border bg-background/60 px-4 py-3">
      <View className="flex-row items-start gap-2">
        {item.emoji ? <Text className="text-lg">{item.emoji}</Text> : null}
        <View className="min-w-0 flex-1">
          <Text className="font-medium text-puce-red">{item.title}</Text>
          <Text className="mt-1 text-sm leading-5 text-ink-muted">{item.body}</Text>
        </View>
      </View>
    </View>
  );
}

function InsightSection({ title, items }: { title: string; items: AiInsightItem[] }) {
  if (items.length === 0) return null;

  return (
    <View>
      <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {title}
      </Text>
      <View className="gap-3">
        {items.map((item) => (
          <InsightCard key={item.id} item={item} />
        ))}
      </View>
    </View>
  );
}

export function AiInsightsPanel({ userId }: Props) {
  const [insights, setInsights] = useState<AiInsightsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAiInsights(userId);
      setInsights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load insights.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Text className="text-sm text-ink-muted">Loading AI insights…</Text>;
  }

  if (error) {
    return (
      <View className="items-center gap-3">
        <Text className="text-center text-sm text-red-600">{error}</Text>
        <Pressable onPress={() => void load()}>
          <Text className="text-sm font-medium text-primary">Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (!insights?.hasData) {
    return (
      <View className="rounded-xl border border-dashed border-brand-border bg-background/70 px-4 py-5">
        <Text className="text-center font-medium text-puce-red">
          Your insights will grow with your trail
        </Text>
        <Text className="mt-2 text-center text-sm text-ink-muted">
          Log reading sessions and finish a few books — personalized highlights, patterns, and
          reflection prompts will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-6">
      <InsightSection title="Highlights" items={insights.highlights} />
      <InsightSection title="Patterns" items={insights.patterns} />
      <InsightSection title="Prompts" items={insights.prompts} />
    </View>
  );
}
