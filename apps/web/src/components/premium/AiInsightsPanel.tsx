"use client";

import { useCallback, useEffect, useState } from "react";
import { getAiInsights, type AiInsightItem, type AiInsightsResult } from "@/lib/services/aiInsights";
import { cn } from "@/lib/utils/cn";

type Props = {
  userId: string;
  className?: string;
};

function InsightCard({ item }: { item: AiInsightItem }) {
  return (
    <article className="rounded-xl border border-border bg-background/60 px-4 py-3 text-left">
      <div className="flex items-start gap-2">
        {item.emoji ? <span className="text-lg leading-none">{item.emoji}</span> : null}
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-puce-red">{item.title}</h4>
          <p className="mt-1 text-sm leading-relaxed text-text-muted">{item.body}</p>
        </div>
      </div>
    </article>
  );
}

function InsightSection({
  title,
  items,
}: {
  title: string;
  items: AiInsightItem[];
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">{title}</h3>
      <div className="space-y-3">{items.map((item) => <InsightCard key={item.id} item={item} />)}</div>
    </section>
  );
}

export function AiInsightsPanel({ userId, className }: Props) {
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
    return <p className={cn("text-sm text-text-muted", className)}>Loading AI insights…</p>;
  }

  if (error) {
    return (
      <div className={cn("space-y-3 text-center", className)}>
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          onClick={() => void load()}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!insights?.hasData) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-border bg-background/70 px-4 py-6 text-center",
          className
        )}
      >
        <p className="font-medium text-puce-red">Your insights will grow with your trail</p>
        <p className="mt-2 text-sm text-text-muted">
          Log reading sessions and finish a few books — personalized highlights, patterns, and
          reflection prompts will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <InsightSection title="Highlights" items={insights.highlights} />
      <InsightSection title="Patterns" items={insights.patterns} />
      <InsightSection title="Prompts" items={insights.prompts} />
    </div>
  );
}
