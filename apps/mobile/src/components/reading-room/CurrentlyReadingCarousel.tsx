import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { AddCurrentlyReadingCard } from "./AddCurrentlyReadingCard";
import { CurrentlyReadingAddSheet } from "./CurrentlyReadingAddSheet";
import { CurrentlyReadingCard } from "./CurrentlyReadingCard";
import type { LibraryBookRow } from "../../services/library";
import { trackProductEvent } from "../../services/productAnalytics";
import { CURRENTLY_READING_ADD_EVENTS } from "../../../../../packages/utils/currentlyReadingAdd";
import { OVERVIEW_SECTION_TITLES } from "../../../../../packages/utils/overviewCopy";

type Props = {
  userId: string;
  items: LibraryBookRow[];
  onRefresh: () => void;
};

export function CurrentlyReadingCarousel({ userId, items, onRefresh }: Props) {
  const [pageWidth, setPageWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const count = items.length + 1;

  function openAdd() {
    trackProductEvent(CURRENTLY_READING_ADD_EVENTS.opened);
    setAddOpen(true);
  }

  return (
    <View className="rounded-2xl border border-brand-border bg-surface p-3">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xl font-semibold text-puce-red">
          {OVERVIEW_SECTION_TITLES.currentlyReading}
        </Text>
        <Text className="text-sm text-ink-muted">
          {index + 1} / {count}
        </Text>
      </View>
      <View
        onLayout={(event) => setPageWidth(event.nativeEvent.layout.width)}
      >
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            if (pageWidth <= 0) return;
            const next = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
            setIndex(Math.max(0, Math.min(count - 1, next)));
          }}
        >
          {items.map((item) => (
            <View key={item.id} style={{ width: pageWidth || undefined }}>
              <CurrentlyReadingCard item={item} />
            </View>
          ))}
          <View style={{ width: pageWidth || undefined }}>
            <AddCurrentlyReadingCard onPress={openAdd} />
          </View>
        </ScrollView>
      </View>
      <CurrentlyReadingAddSheet
        userId={userId}
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={onRefresh}
      />
    </View>
  );
}
