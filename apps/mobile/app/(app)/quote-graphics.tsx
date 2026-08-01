import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../../src/components/Button";
import { FeatureLimitModal } from "../../src/components/FeatureLimitModal";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import {
  consumeQuoteGraphicSlot,
  getQuoteGraphicsRemaining,
} from "../../src/services/usageCounters";
import { useAuthStore } from "../../src/store/authStore";
import { isEntitlementLimitError } from "../../src/utils/subscription";
import { SANS_FONT, SANS_FONT_BOLD, SERIF_DISPLAY_FONT } from "../../src/constants/theme";
import { useThemeColors } from "../../src/store/themeStore";
import { TAB_BAR_SPACE } from "../../src/navigation/TabBarScroll";

const FEATURE_FLAG_AI_GRAPHICS = false;

export default function QuoteGraphicsRoute() {
  const router = useRouter();
  const colors = useThemeColors();
  const userId = useAuthStore((s) => s.user?.id);
  const [quote, setQuote] = useState("");
  const [attribution, setAttribution] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refreshRemaining = useCallback(async () => {
    if (!userId) return;
    setRemaining(await getQuoteGraphicsRemaining(userId));
  }, [userId]);

  useEffect(() => {
    void refreshRemaining();
  }, [refreshRemaining]);

  async function handleSave() {
    if (!userId) return;
    if (!quote.trim()) {
      setMessage("Add a quote first.");
      return;
    }
    if (remaining === 0) {
      setLimitOpen(true);
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      if (FEATURE_FLAG_AI_GRAPHICS) {
        throw new Error("AI quote graphics are not enabled yet.");
      }
      const result = await consumeQuoteGraphicSlot(userId);
      if (!result.ok) {
        if (isEntitlementLimitError(result.error)) {
          setLimitOpen(true);
        } else {
          setMessage(result.error);
        }
        return;
      }
      setRemaining(result.remaining);
      setPreview(true);
      setMessage(`Saved. ${result.remaining} left this month.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create graphic.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Quote graphics" />
      <FeatureLimitModal
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        featureLabel="Quote graphics"
        limitMessage="Free members can create 3 quote graphics per month. Upgrade to Bookmarked Plus for unlimited graphics."
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontFamily: SANS_FONT, color: colors.inkMuted }}>
          Free members get 3 quote graphics per month.
        </Text>
        <Text className="mt-2 text-xs font-semibold text-puce-red" style={{ fontFamily: SANS_FONT_BOLD }}>
          {remaining == null ? "…" : `${remaining} left this month`}
        </Text>

        <Text className="mt-5 mb-2 text-sm font-medium text-ink">Quote</Text>
        <TextInput
          value={quote}
          onChangeText={setQuote}
          multiline
          placeholder="Paste a passage…"
          placeholderTextColor="#A99DAE"
          className="min-h-[100px] rounded-2xl border border-brand-border bg-surface px-3 py-3 text-ink"
        />

        <Text className="mt-4 mb-2 text-sm font-medium text-ink">Attribution</Text>
        <TextInput
          value={attribution}
          onChangeText={setAttribution}
          placeholder="Book or author"
          placeholderTextColor="#A99DAE"
          className="min-h-[44px] rounded-2xl border border-brand-border bg-surface px-3 py-3 text-ink"
        />

        <View className="mt-4 gap-2">
          <Button title="Preview" variant="outline" onPress={() => setPreview(Boolean(quote.trim()))} />
          <Button title="Save graphic" loading={saving} onPress={() => void handleSave()} />
          <Button title="Back to notes" variant="ghost" onPress={() => router.push("/(app)/notes")} />
        </View>

        {message ? (
          <Text className="mt-3 text-sm" style={{ fontFamily: SANS_FONT, color: colors.inkMuted }}>
            {message}
          </Text>
        ) : null}

        {preview && quote.trim() ? (
          <View className="mt-5 rounded-2xl bg-puce-red p-5">
            <Text className="text-xl leading-7 text-white" style={{ fontFamily: SERIF_DISPLAY_FONT }}>
              “{quote.trim()}”
            </Text>
            {attribution.trim() ? (
              <Text className="mt-3 text-sm text-white/85" style={{ fontFamily: SANS_FONT }}>
                — {attribution.trim()}
              </Text>
            ) : null}
            <Text className="mt-6 text-[11px] uppercase tracking-widest text-white/70">Bookmarked</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
