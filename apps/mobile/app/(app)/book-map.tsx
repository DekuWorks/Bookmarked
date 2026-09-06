import { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import {
  BOOK_MAP_EMPTY_CAFE_COPY,
  BOOK_MAP_FILTERS,
  BOOK_MAP_NAV_LABEL,
  BOOK_MAP_PLACE_REPORT_LABELS,
  BOOK_MAP_PLACE_REPORT_REASONS,
  osMapsDirectionsUrl,
  type BookMapFilter,
} from "../../../../packages/utils/bookMap";
import type { BookMapPlace } from "../../../../packages/utils/mapProvider";
import { Button } from "../../src/components/Button";
import { LoadingState } from "../../src/components/LoadingState";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { useSubscription } from "../../src/hooks/useSubscription";
import { TAB_BAR_SPACE } from "../../src/navigation/TabBarScroll";
import { listBookMapPlaces, reportBookMapPlace } from "../../src/services/bookMap";
import { IOS_HOME_SUBSCRIBE_COPY } from "../../../../packages/utils/subscription";

export default function BookMapScreen() {
  const { width } = useWindowDimensions();
  const isPad = width >= 768;
  const { canAccess, loading } = useSubscription();
  const hasHome = canAccess("book_map");
  const [places, setPlaces] = useState<BookMapPlace[] | null>(null);
  const [filter, setFilter] = useState<BookMapFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHome) return;
    void listBookMapPlaces({ category: filter, text: query })
      .then((rows) => {
        setPlaces(rows);
        setSelectedId(rows[0]?.id ?? null);
      })
      .catch(() => setPlaces([]));
  }, [filter, hasHome, query]);

  const selected = useMemo(
    () => (places ?? []).find((place) => place.id === selectedId) ?? null,
    [places, selectedId]
  );

  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title={BOOK_MAP_NAV_LABEL} />
        <LoadingState message="Loading Book Map…" />
      </View>
    );
  }

  if (!hasHome) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title={BOOK_MAP_NAV_LABEL} />
        <View className="p-4">
          <Text className="text-lg font-semibold text-puce-red">{IOS_HOME_SUBSCRIBE_COPY.headline}</Text>
          <Text className="mt-2 text-ink-muted">{IOS_HOME_SUBSCRIBE_COPY.body}</Text>
        </View>
      </View>
    );
  }

  const list = (
    <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE, gap: 8, padding: 16 }}>
      <View className="flex-row flex-wrap gap-2">
        {BOOK_MAP_FILTERS.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setFilter(item.id)}
            className={`rounded-full px-3 py-2 ${filter === item.id ? "bg-puce-red" : "border border-brand-border"}`}
          >
            <Text className={filter === item.id ? "text-white" : "text-ink"}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="City, ZIP, or place"
        className="rounded-xl border border-brand-border bg-surface px-3 py-2 text-ink"
      />
      {(places ?? []).map((place) => (
        <Pressable
          key={place.id}
          onPress={() => setSelectedId(place.id)}
          className="rounded-2xl border border-brand-border bg-surface p-4"
        >
          <Text className="font-semibold text-puce-red">{place.name}</Text>
          <Text className="text-xs uppercase text-ink-muted">{place.category}</Text>
          {place.city ? <Text className="mt-1 text-sm text-ink-muted">{place.city}</Text> : null}
        </Pressable>
      ))}
      {filter === "reading_cafe" && !(places ?? []).length ? (
        <Text className="text-sm text-ink-muted">{BOOK_MAP_EMPTY_CAFE_COPY}</Text>
      ) : null}
    </ScrollView>
  );

  const sheet = selected ? (
    <View className="rounded-t-3xl border-t border-brand-border bg-surface p-4">
      <Text className="text-xs uppercase text-ink-muted">
        {selected.verified ? "Verified" : "Unverified"}
      </Text>
      <Text className="mt-1 text-lg font-semibold text-puce-red">{selected.name}</Text>
      {selected.address_text ? <Text className="mt-1 text-sm text-ink-muted">{selected.address_text}</Text> : null}
      <View className="mt-3 gap-2">
        <Button
          title="Directions"
          onPress={() => void Linking.openURL(osMapsDirectionsUrl(selected, "ios"))}
        />
        {BOOK_MAP_PLACE_REPORT_REASONS.slice(0, 3).map((reason) => (
          <Button
            key={reason}
            title={BOOK_MAP_PLACE_REPORT_LABELS[reason]}
            variant="ghost"
            onPress={() => {
              void reportBookMapPlace(selected.id, reason).then((result) => {
                setMessage(result.error ?? "Reported. Thank you.");
              });
            }}
          />
        ))}
      </View>
      {message ? <Text className="mt-2 text-xs text-ink-muted">{message}</Text> : null}
    </View>
  ) : null;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={BOOK_MAP_NAV_LABEL} />
      {isPad ? (
        <View className="flex-1 flex-row">
          <View className="flex-1">{list}</View>
          <View className="w-[340px] border-l border-brand-border">{sheet}</View>
        </View>
      ) : (
        <View className="flex-1">
          <View className="flex-1">{list}</View>
          {sheet}
        </View>
      )}
    </View>
  );
}
