import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  computeReadingDna,
  titleCaseDnaLabel,
  type ReadingDna,
} from "../../../../packages/utils/readingDna";
import {
  loadReadingDnaBundle,
  persistReadingDnaSnapshot,
} from "../services/readingDna";
import { SANS_FONT, SANS_FONT_BOLD, SANS_FONT_MEDIUM, SERIF_DISPLAY_FONT } from "../constants/theme";
import { useThemeColors } from "../store/themeStore";
import { UpgradePrompt } from "./UpgradePrompt";

type AccessFeature =
  | "full_reading_dna"
  | "reading_dna_dashboard"
  | "reading_dna_ai_insights"
  | "reading_dna_book_matches"
  | "book_matches"
  | "reading_dna_match";

type Props = {
  userId: string;
  favoriteGenres: string[];
  canAccess: (feature: AccessFeature) => boolean;
  onUpgrade?: () => void;
};

export function ReadingDnaSection({ userId, favoriteGenres, canAccess }: Props) {
  const router = useRouter();
  const colors = useThemeColors();
  const [dna, setDna] = useState<ReadingDna>(() =>
    computeReadingDna({ shelves: favoriteGenres.map((genre) => ({ genre })) })
  );
  const [loading, setLoading] = useState(true);

  const hasPlus = canAccess("full_reading_dna");
  const hasHome = canAccess("reading_dna_match");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadReadingDnaBundle(userId, favoriteGenres)
      .then((bundle) => {
        if (cancelled) return;
        setDna(bundle.dna);
        if (!bundle.fromCache) void persistReadingDnaSnapshot(userId, bundle.dna);
      })
      .catch(() => {
        if (!cancelled) {
          setDna(computeReadingDna({ shelves: favoriteGenres.map((genre) => ({ genre })) }));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, favoriteGenres]);

  const heroTraits = useMemo(
    () => (hasPlus ? dna.personaTraits : dna.topTraits),
    [dna.personaTraits, dna.topTraits, hasPlus]
  );

  return (
    <View className="mt-6 overflow-hidden rounded-2xl border border-brand-border bg-surface">
      <View className="bg-puce-red px-4 py-5">
        <Text className="text-xs uppercase tracking-widest text-white/80" style={{ fontFamily: SANS_FONT_BOLD }}>
          Bookmarked
        </Text>
        <Text className="mt-1 text-2xl text-white" style={{ fontFamily: SERIF_DISPLAY_FONT }}>
          My Reading DNA
        </Text>
        <Text className="mt-2 text-sm text-white/85" style={{ fontFamily: SANS_FONT }}>
          {loading ? "Shaping your DNA from your library…" : dna.summary}
        </Text>
        <Text
          className="mt-2 text-[11px] uppercase tracking-wide text-white/75"
          style={{ fontFamily: SANS_FONT_MEDIUM }}
        >
          {hasPlus ? (hasHome ? "Home" : "Plus") : "Free · Top 3"} · Confidence {dna.confidence}
        </Text>
        <View className="mt-4 flex-row flex-wrap gap-2" accessibilityLabel="Top Reading DNA traits">
          {heroTraits.map((trait) => (
            <Text
              key={`${trait.category}-${trait.label}`}
              className="rounded-full bg-white/15 px-3 py-1.5 text-sm text-white"
              style={{ fontFamily: SANS_FONT_MEDIUM }}
            >
              {trait.emoji} {trait.persona ?? titleCaseDnaLabel(trait.label)}
            </Text>
          ))}
        </View>
      </View>

      <View className="gap-3 p-4">
        {!hasPlus ? (
          <UpgradePrompt
            title="Unlock your full Reading DNA"
            description="Free shows your top 3 traits. Open the full DNA page for every strand — Plus unlocks the complete view."
          />
        ) : null}
        {loading ? <ActivityIndicator color={colors.puceRed} /> : null}
        <Pressable
          onPress={() => router.push("/(app)/reading-dna")}
          className="self-start rounded-full bg-puce-red px-4 py-2 active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel="Open full Reading DNA"
        >
          <Text style={{ fontFamily: SANS_FONT_BOLD, color: "#fff" }}>Open full Reading DNA</Text>
        </Pressable>
      </View>
    </View>
  );
}
