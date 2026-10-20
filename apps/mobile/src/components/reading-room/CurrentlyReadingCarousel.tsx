import { useEffect, useRef, useState } from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { AddCurrentlyReadingCard } from "./AddCurrentlyReadingCard";
import { CurrentlyReadingAddSheet } from "./CurrentlyReadingAddSheet";
import { CurrentlyReadingCard } from "./CurrentlyReadingCard";
import type { LibraryBookRow } from "../../services/library";
import { trackProductEvent } from "../../services/productAnalytics";
import { CURRENTLY_READING_ADD_EVENTS } from "../../../../../packages/utils/currentlyReadingAdd";
import { OVERVIEW_SECTION_TITLES } from "../../../../../packages/utils/overviewCopy";
import { carouselIndexAfterMove } from "../../../../../packages/utils/readingRoomMotion";

type Props = {
  userId: string;
  items: LibraryBookRow[];
  onRefresh: () => void;
  onMoveStart?: (row: LibraryBookRow) => void;
  onMoveFailed?: (row: LibraryBookRow) => void;
};

let rememberedCarouselIndex = 0;

export function CurrentlyReadingCarousel({
  userId,
  items,
  onRefresh,
  onMoveStart,
  onMoveFailed,
}: Props) {
  const { width } = useWindowDimensions();
  const minHeight = width >= 768 ? 280 : 220;
  const scroller = useRef<ScrollView>(null);
  const [pageWidth, setPageWidth] = useState(0);
  const [index, setIndex] = useState(() =>
    carouselIndexAfterMove(rememberedCarouselIndex, 0, items.length + 1)
  );
  const [addOpen, setAddOpen] = useState(false);
  const restored = useRef(false);
  const count = items.length + 1;

  useEffect(() => {
    setIndex((current) => {
      const next = carouselIndexAfterMove(current, 0, count);
      rememberedCarouselIndex = next;
      return next;
    });
  }, [count]);

  useEffect(() => {
    if (restored.current || pageWidth <= 0) return;
    restored.current = true;
    const next = carouselIndexAfterMove(rememberedCarouselIndex, 0, count);
    setIndex(next);
    if (next > 0) {
      scroller.current?.scrollTo({ x: next * pageWidth, animated: false });
    }
  }, [count, pageWidth]);

  function syncIndex(offsetX: number) {
    if (pageWidth <= 0) return;
    const next = carouselIndexAfterMove(Math.round(offsetX / pageWidth), 0, count);
    rememberedCarouselIndex = next;
    setIndex(next);
  }

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
        <Text className="text-sm text-ink-muted" accessibilityLiveRegion="polite">
          {index + 1} / {count}
        </Text>
      </View>
      <View onLayout={(event) => setPageWidth(event.nativeEvent.layout.width)}>
        <ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          directionalLockEnabled
          disableIntervalMomentum
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          snapToInterval={pageWidth > 0 ? pageWidth : undefined}
          snapToAlignment="start"
          onMomentumScrollEnd={(event) => syncIndex(event.nativeEvent.contentOffset.x)}
  onScrollEndDrag={(event) => {
            const velocity = event.nativeEvent.velocity?.x ?? 0;
            if (Math.abs(velocity) > 0.05) return;
            syncIndex(event.nativeEvent.contentOffset.x);
          }}
        >
          {items.map((item) => (
            <View key={item.id} style={{ width: pageWidth || undefined }}>
              <CurrentlyReadingCard item={item} />
            </View>
          ))}
          <View style={{ width: pageWidth || undefined }}>
            <AddCurrentlyReadingCard minHeight={minHeight} onPress={openAdd} />
          </View>
        </ScrollView>
      </View>
      <CurrentlyReadingAddSheet
        userId={userId}
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={onRefresh}
        onMoveStart={onMoveStart}
        onMoveFailed={onMoveFailed}
      />
    </View>
  );
}
