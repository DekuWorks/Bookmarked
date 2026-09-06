import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { DEFAULT_HOME_ELIGIBILITY_FLAGS, type AgeEligibilityStatus } from "../../../../packages/utils/homeEligibility";
import { READER_MAP_OPT_IN_COPY } from "../../../../packages/utils/locationPrivacy";
import {
  DEFAULT_READER_MAP_SETTINGS,
  READER_MAP_NAV_LABEL,
  applyReaderMapFilters,
  readerMapSocialAllowed,
  type ReaderMapSettings,
  type VisibleReaderCard,
} from "../../../../packages/utils/readerMap";
import { IOS_HOME_SUBSCRIBE_COPY } from "../../../../packages/utils/subscription";
import { Button } from "../../src/components/Button";
import { LoadingState } from "../../src/components/LoadingState";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { useSubscription } from "../../src/hooks/useSubscription";
import { TAB_BAR_SPACE } from "../../src/navigation/TabBarScroll";
import {
  listReaderMapMarkers,
  loadAgeStatus,
  loadReaderMapSettings,
  saveReaderMapSettings,
} from "../../src/services/readerMap";

export default function ReaderMapScreen() {
  const { canAccess, loading } = useSubscription();
  const hasHome = canAccess("reader_map");
  const [settings, setSettings] = useState<ReaderMapSettings>(DEFAULT_READER_MAP_SETTINGS);
  const [ageStatus, setAgeStatus] = useState<AgeEligibilityStatus>("unknown");
  const [cards, setCards] = useState<VisibleReaderCard[]>([]);
  const [city, setCity] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHome) return;
    void Promise.all([loadReaderMapSettings(), loadAgeStatus()]).then(([next, age]) => {
      setSettings(next);
      setAgeStatus(age);
    });
  }, [hasHome]);

  const allowed = readerMapSocialAllowed({
    hasHome,
    settings,
    ageStatus,
    flags: DEFAULT_HOME_ELIGIBILITY_FLAGS,
    extraTrustOk: true,
  });

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title={READER_MAP_NAV_LABEL} />
        <LoadingState />
      </View>
    );
  }

  if (!hasHome) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title={READER_MAP_NAV_LABEL} />
        <View className="p-4">
          <Text className="text-lg font-semibold text-puce-red">{IOS_HOME_SUBSCRIBE_COPY.headline}</Text>
          <Text className="mt-2 text-ink-muted">{IOS_HOME_SUBSCRIBE_COPY.body}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={READER_MAP_NAV_LABEL} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE, gap: 12 }}>
        <Text className="font-semibold text-puce-red">{READER_MAP_OPT_IN_COPY.title}</Text>
        <Text className="text-sm text-ink-muted">{READER_MAP_OPT_IN_COPY.body}</Text>
        <Text className="text-xs text-ink-muted">
          Personality on the map needs DNA visibility consent. Home is not consent.
        </Text>
        {ageStatus !== "eligible" ? (
          <Text className="text-sm text-rust">
            Nearby readers stay off until age is known and meets the configured minimum. That minimum
            has not been set.
          </Text>
        ) : null}
        <Button
          title={settings.opted_in ? "Turn off discoverability" : "Opt in"}
          onPress={() => {
            const next = { ...settings, opted_in: !settings.opted_in, discoverable: !settings.opted_in };
            setSettings(next);
            void saveReaderMapSettings(next);
          }}
        />
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="City filter"
          className="rounded-xl border border-brand-border bg-surface px-3 py-2 text-ink"
        />
        <Button
          title="Search this area"
          variant="secondary"
          disabled={!allowed}
          onPress={() => {
            void listReaderMapMarkers({
              minLat: 24,
              maxLat: 50,
              minLng: -125,
              maxLng: -66,
            })
              .then(setCards)
              .catch((error) => setMessage(error instanceof Error ? error.message : "Could not load."));
          }}
        />
        {applyReaderMapFilters(cards, { city }).map((card) => (
          <View key={card.user_id} className="rounded-2xl border border-brand-border bg-surface p-4">
            <Text className="font-semibold text-puce-red">
              {card.display_name ?? card.username ?? "Reader"}
            </Text>
            <Text className="text-sm text-ink-muted">{card.city_label ?? "Area hidden"}</Text>
            {card.personality_label ? <Text className="mt-1">{card.personality_label}</Text> : null}
            <Text className="mt-2 text-xs text-ink-muted">In your area</Text>
          </View>
        ))}
        {message ? <Text className="text-sm text-ink-muted">{message}</Text> : null}
      </ScrollView>
    </View>
  );
}
