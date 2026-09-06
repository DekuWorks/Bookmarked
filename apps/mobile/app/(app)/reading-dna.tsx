import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  deriveReadingPersonality,
  titleCaseDnaLabel,
  type ReadingDna,
  type ReadingDnaCategoryBreakdown,
  type ReadingDnaHabit,
} from "../../../../packages/utils/readingDna";
import { DEFAULT_READING_DNA_PRIVACY, type ReadingDnaPrivacyState } from "../../../../packages/utils/readingDnaPrivacy";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { UpgradePrompt } from "../../src/components/UpgradePrompt";
import { useSubscription } from "../../src/hooks/useSubscription";
import { useProfile } from "../../src/hooks/useProfile";
import { TAB_BAR_SPACE } from "../../src/navigation/TabBarScroll";
import {
  loadDnaBookMatches,
  loadReadingDnaBundle,
  loadReadingDnaComparisons,
  loadSimilarReaders,
  persistReadingDnaSnapshot,
  saveReadingDnaPrivacy,
} from "../../src/services/readingDna";
import { getUserLibraryBooks } from "../../src/services/library";
import { useAuthStore } from "../../src/store/authStore";
import { READING_DNA_ASSETS } from "../../src/constants/readingDnaAssets";
import { SANS_FONT, SANS_FONT_BOLD, SANS_FONT_MEDIUM, SERIF_DISPLAY_FONT } from "../../src/constants/theme";
import { useThemeColors } from "../../src/store/themeStore";

const DONUT_COLORS = ["#642F37", "#B89DBB", "#F3904B", "#C0350F", "#F7C767", "#8B6B8E", "#D4B8D6"];

function CategoryCard({
  breakdown,
  locked,
  colors,
}: {
  breakdown: ReadingDnaCategoryBreakdown;
  locked: boolean;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View
      className="mb-3 rounded-2xl border border-brand-border bg-background/70 p-4"
      style={{ opacity: locked ? 0.55 : 1 }}
      accessibilityElementsHidden={locked}
    >
      <Text style={{ fontFamily: SERIF_DISPLAY_FONT, color: colors.puceRed, fontSize: 18 }}>
        {breakdown.title}
      </Text>
      <Text className="mt-0.5 text-xs" style={{ fontFamily: SANS_FONT, color: colors.inkMuted }}>
        {breakdown.subtitle}
      </Text>
      <View className="mt-3 gap-2">
        {breakdown.traits.slice(0, 6).map((trait, index) => (
          <View key={trait.label} className="flex-row items-center gap-2">
            <View
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
            />
            <Text className="flex-1 capitalize" style={{ fontFamily: SANS_FONT, color: colors.ink }}>
              {titleCaseDnaLabel(trait.label)}
            </Text>
            <Text style={{ fontFamily: SANS_FONT_MEDIUM, color: colors.puceRed }}>{trait.percent}%</Text>
          </View>
        ))}
        {!breakdown.traits.length ? (
          <Text className="text-xs" style={{ fontFamily: SANS_FONT, color: colors.inkMuted }}>
            {breakdown.emptyCopy}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function HabitBars({
  habits,
  locked,
  colors,
}: {
  habits: ReadingDnaHabit[];
  locked: boolean;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View
      className="rounded-2xl border border-brand-border bg-background/70 p-4"
      style={{ opacity: locked ? 0.55 : 1 }}
    >
      <Text style={{ fontFamily: SERIF_DISPLAY_FONT, color: colors.puceRed, fontSize: 18 }}>
        Reading Habits
      </Text>
      <View className="mt-3 gap-3">
        {habits.slice(0, 7).map((habit) => (
          <View key={habit.label}>
            <View className="mb-1 flex-row items-center justify-between">
              <Text className="capitalize" style={{ fontFamily: SANS_FONT, color: colors.ink }}>
                {habit.emoji} {habit.persona ?? titleCaseDnaLabel(habit.label)}
              </Text>
              <Text style={{ fontFamily: SANS_FONT, color: colors.inkMuted, fontSize: 12 }}>
                {habit.evidenceCount} signals
              </Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-primary/15">
              <View
                className="h-full rounded-full bg-puce-red"
                style={{ width: `${Math.min(100, Math.max(habit.evidenceCount * 8, 8))}%` }}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ReadingDnaRoute() {
  const router = useRouter();
  const colors = useThemeColors();
  const userId = useAuthStore((s) => s.user?.id);
  const { data: profile } = useProfile();
  const { canAccess } = useSubscription();
  const [dna, setDna] = useState<ReadingDna | null>(null);
  const [privacy, setPrivacy] = useState<ReadingDnaPrivacyState>(DEFAULT_READING_DNA_PRIVACY);
  const [booksRead, setBooksRead] = useState(0);
  const [yoyLabel, setYoyLabel] = useState<string | null>(null);
  const [similarLabel, setSimilarLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const hasPlus = canAccess("full_reading_dna");
  const hasHome = canAccess("reading_dna_match");
  const favoriteGenres = profile?.favorite_genres ?? [];

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    void Promise.all([
      loadReadingDnaBundle(userId, favoriteGenres),
      getUserLibraryBooks(userId),
    ])
      .then(async ([bundle, books]) => {
        if (cancelled) return;
        setDna(bundle.dna);
        setPrivacy(bundle.privacy);
        setBooksRead(books.filter((row) => row.shelf_status === "read").length);
        if (!bundle.fromCache) void persistReadingDnaSnapshot(userId, bundle.dna);
        if (hasPlus) {
          const compare = await loadReadingDnaComparisons(userId);
          if (!cancelled && compare.yoy[0]) {
            setYoyLabel(
              `${compare.yoy[0].label} ${compare.yoy[0].delta > 0 ? "+" : ""}${compare.yoy[0].delta} pts`
            );
          }
        }
        if (hasHome) {
          const similar = await loadSimilarReaders(bundle.dna);
          if (!cancelled && similar[0]) {
            setSimilarLabel(`${similar[0].displayName} · ${similar[0].percent}%`);
          }
        }
        if (hasPlus) {
          await loadDnaBookMatches(userId, bundle.dna);
        }
      })
      .catch(() => {
        if (!cancelled) setDna(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, favoriteGenres, hasPlus, hasHome]);

  const heroTraits = useMemo(() => {
    if (!dna) return [];
    return hasPlus ? dna.personaTraits : dna.topTraits;
  }, [dna, hasPlus]);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Reading DNA" fallbackHref="/(app)/profile" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE }}>
        {loading && !dna ? (
          <ActivityIndicator color={colors.puceRed} />
        ) : dna ? (
          <View className="overflow-hidden rounded-2xl border border-brand-border bg-surface">
            <ImageBackground
              source={READING_DNA_ASSETS.heroBg}
              resizeMode="cover"
              className="overflow-hidden"
              imageStyle={{ opacity: 0.45 }}
            >
              <View className="bg-puce-red/80 px-4 py-5">
                <Text className="text-xs uppercase tracking-widest text-white/80" style={{ fontFamily: SANS_FONT_BOLD }}>
                  Bookmarked
                </Text>
                <Text className="mt-1 text-2xl text-white" style={{ fontFamily: SERIF_DISPLAY_FONT }}>
                  My Reading DNA
                </Text>
                <Text className="mt-2 text-sm text-white/85" style={{ fontFamily: SANS_FONT }}>
                  {dna.summary}
                </Text>
                <Text
                  className="mt-2 text-[11px] uppercase tracking-wide text-white/75"
                  style={{ fontFamily: SANS_FONT_MEDIUM }}
                >
                  {hasPlus ? (hasHome ? "Home" : "Plus") : "Free · Top 3"} · Confidence {dna.confidence}
                </Text>
                <View className="mt-4 flex-row flex-wrap gap-2">
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
                <Text className="mt-4 text-sm text-white/85" style={{ fontFamily: SANS_FONT }}>
                  {booksRead} Books Read · Sample {dna.sampleSize}
                </Text>
              </View>
            </ImageBackground>

            <View className="gap-3 p-4">
              {!hasPlus ? (
                <UpgradePrompt
                  title="Unlock your full Reading DNA"
                  description="Free shows your top 3 traits. Plus unlocks Genre, Vibe, Emotion, Trope DNA, habits, and matches."
                />
              ) : null}

              {dna.categories.map((breakdown) => (
                <CategoryCard
                  key={breakdown.category}
                  breakdown={breakdown}
                  locked={!hasPlus}
                  colors={colors}
                />
              ))}

              <HabitBars habits={dna.habits} locked={!hasPlus} colors={colors} />

              {yoyLabel ? (
                <View className="rounded-2xl border border-brand-border bg-background/70 p-4">
                  <Text style={{ fontFamily: SERIF_DISPLAY_FONT, color: colors.puceRed, fontSize: 18 }}>
                    Year over year
                  </Text>
                  <Text className="mt-2" style={{ fontFamily: SANS_FONT, color: colors.ink }}>
                    {yoyLabel}
                  </Text>
                </View>
              ) : null}

              {hasHome && similarLabel ? (
                <View className="rounded-2xl border border-brand-border bg-background/70 p-4">
                  <Text style={{ fontFamily: SERIF_DISPLAY_FONT, color: colors.puceRed, fontSize: 18 }}>
                    Similar readers
                  </Text>
                  <Text className="mt-2" style={{ fontFamily: SANS_FONT, color: colors.ink }}>
                    {similarLabel}
                  </Text>
                </View>
              ) : null}

              <View className="rounded-2xl border border-brand-border bg-background/70 p-4">
                <Text style={{ fontFamily: SERIF_DISPLAY_FONT, color: colors.puceRed, fontSize: 18 }}>
                  DNA visibility
                </Text>
                <Text className="mt-2 text-sm" style={{ fontFamily: SANS_FONT, color: colors.inkMuted }}>
                  Now {privacy.visibility}. Private DNA never appears on Match or Reader Map.
                </Text>
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {(["followers", "public", "private"] as const).map((value) => (
                    <Pressable
                      key={value}
                      onPress={() => {
                        const next = { ...privacy, visibility: value };
                        setPrivacy(next);
                        void saveReadingDnaPrivacy(next);
                      }}
                      className="rounded-full px-3 py-1.5"
                      style={{ backgroundColor: privacy.visibility === value ? colors.puceRed : "#ffffff22" }}
                    >
                      <Text style={{ fontFamily: SANS_FONT_MEDIUM, color: privacy.visibility === value ? "#fff" : colors.ink }}>
                        {value}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Pressable
                onPress={() => router.push(hasHome ? "/(app)/reader-map" : "/(app)/upgrade")}
                className="rounded-2xl border border-primary/30 bg-primary/10 p-4"
              >
                <Text style={{ fontFamily: SERIF_DISPLAY_FONT, color: colors.puceRed, fontSize: 18 }}>
                  {hasHome ? "Reading Personality" : "Membership"}
                </Text>
                <Text className="mt-2" style={{ fontFamily: SANS_FONT, color: colors.inkMuted }}>
                  {hasHome
                    ? deriveReadingPersonality(dna)?.explanation ??
                      "Home scores an explainable personality from your cached DNA traits."
                    : "Explore Plus for full DNA. Home adds personality and Reader Map filters."}
                </Text>
                {hasHome && deriveReadingPersonality(dna) ? (
                  <Text className="mt-2" style={{ fontFamily: SANS_FONT_BOLD, color: colors.puceRed }}>
                    {deriveReadingPersonality(dna)?.label}
                  </Text>
                ) : null}
              </Pressable>
            </View>
          </View>
        ) : (
          <Text style={{ fontFamily: SANS_FONT, color: colors.inkMuted }}>
            Could not load Reading DNA.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
