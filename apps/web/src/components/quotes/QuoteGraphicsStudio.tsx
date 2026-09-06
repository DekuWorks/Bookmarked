"use client";

import { useCallback, useEffect, useState } from "react";
import { FeatureLimitModal } from "@/components/premium/FeatureLimitModal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import {
  consumeQuoteGraphicSlot,
  getQuoteGraphicsRemaining,
  refundQuoteGraphicSlot,
} from "@/lib/services/usageCounters";
import { searchNotes } from "@/lib/services/readingNotes";
import { isEntitlementLimitError } from "@/lib/utils/subscription";
import { PLUS_UNLIMITED_FAIR_USE_COPY } from "@bookmarked/utils/subscription";
import { cn } from "@/lib/utils/cn";

type Props = {
  userId: string;
};

const FEATURE_FLAG_AI_GRAPHICS = false;

/**
 * Free: 3 quote graphics / month via usage_counters.
 * Generation is feature-flagged; preview still works locally without consuming
 * a slot until the user confirms "Save graphic".
 */
export function QuoteGraphicsStudio({ userId }: Props) {
  const toast = useToast();
  const [quote, setQuote] = useState("");
  const [attribution, setAttribution] = useState("");
  const [favorites, setFavorites] = useState<Array<{ id: string; quote: string }>>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);

  const refreshRemaining = useCallback(async () => {
    const value = await getQuoteGraphicsRemaining(userId);
    setRemaining(value);
  }, [userId]);

  useEffect(() => {
    void refreshRemaining();
    void searchNotes({ userId, category: "favorite_quote", limit: 25 }).then((notes) => {
      setFavorites(
        notes
          .filter((note) => note.quote?.trim())
          .map((note) => ({ id: note.id, quote: note.quote!.trim() }))
      );
    });
  }, [refreshRemaining, userId]);

  async function handlePreview() {
    if (!quote.trim()) {
      toast.error("Add a quote to preview.");
      return;
    }
    setPreview(true);
  }

  async function handleSaveGraphic() {
    if (!quote.trim()) {
      toast.error("Add a quote first.");
      return;
    }

    if (remaining === 0) {
      setLimitOpen(true);
      return;
    }

    setSaving(true);
    let consumed = false;
    try {
      if (FEATURE_FLAG_AI_GRAPHICS) {
        // Reserved for Higgsfield / AI render path.
        throw new Error("AI quote graphics are not enabled yet.");
      }

      const result = await consumeQuoteGraphicSlot(userId);
      if (!result.ok) {
        if (isEntitlementLimitError(result.error)) {
          setLimitOpen(true);
        } else {
          toast.error(result.error);
        }
        return;
      }
      consumed = true;

      setRemaining(result.remaining);
      setPreview(true);
      toast.success(
        `Graphic saved to your vault preview. ${result.remaining} remaining this month.`
      );
    } catch (error) {
      if (consumed) {
        await refundQuoteGraphicSlot(userId);
        await refreshRemaining();
      }
      toast.error(error instanceof Error ? error.message : "Could not create graphic.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="surface-card space-y-4 p-5 sm:p-6">
      <FeatureLimitModal
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        featureLabel="Quote graphics"
        limitMessage="Free members can create 3 quote graphics per month. Upgrade to Bookmarked Plus for unlimited graphics."
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-puce-red">Quote graphics</h2>
          <p className="mt-1 text-sm text-text-muted">
            Turn a favorite line into a shareable card. Free members get 3 per month.
          </p>
          <p className="mt-1 text-xs text-text-muted">{PLUS_UNLIMITED_FAIR_USE_COPY}</p>
        </div>
        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-puce-red">
          {remaining == null ? "…" : `${remaining} left this month`}
        </span>
      </div>

      {!FEATURE_FLAG_AI_GRAPHICS ? (
        <p className="rounded-xl border border-dashed border-border bg-background/60 px-3 py-2 text-xs text-text-muted">
          Graphics are generated from your favorite quotes. A Free monthly slot is used only after a
          graphic saves successfully.
        </p>
      ) : null}

      {favorites.length > 0 ? (
        <label className="block text-sm font-medium text-text">
          Favorite quote
          <select
            className="mt-1.5 w-full min-h-[44px] rounded-lg border border-border bg-surface px-3 py-2"
            value=""
            onChange={(event) => {
              const selected = favorites.find((item) => item.id === event.target.value);
              if (selected) setQuote(selected.quote);
            }}
          >
            <option value="">Choose a saved favorite…</option>
            {favorites.map((item) => (
              <option key={item.id} value={item.id}>
                {item.quote.slice(0, 80)}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <Textarea
        label="Quote"
        value={quote}
        onChange={(e) => setQuote(e.target.value)}
        placeholder="Pick a favorite quote or paste a line…"
        className="min-h-[96px]"
      />
      <Textarea
        label="Attribution (optional)"
        value={attribution}
        onChange={(e) => setAttribution(e.target.value)}
        placeholder="Book or author"
        className="min-h-[64px]"
      />

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => void handlePreview()}>
          Preview
        </Button>
        <Button
          type="button"
          variant="secondary"
          loading={saving}
          onClick={() => void handleSaveGraphic()}
        >
          Save graphic
        </Button>
      </div>

      {preview && quote.trim() ? (
        <figure
          className={cn(
            "rounded-2xl border border-border bg-gradient-to-br from-puce-red via-[#7a3d4a] to-primary p-6 text-white",
            "motion-safe:transition-opacity motion-reduce:transition-none"
          )}
          aria-label="Quote graphic preview"
        >
          <blockquote className="font-display text-xl leading-relaxed">
            “{quote.trim()}”
          </blockquote>
          {attribution.trim() ? (
            <figcaption className="mt-4 text-sm text-white/85">— {attribution.trim()}</figcaption>
          ) : null}
          <p className="mt-6 text-[11px] uppercase tracking-[0.2em] text-white/70">Bookmarked</p>
        </figure>
      ) : null}
    </section>
  );
}
