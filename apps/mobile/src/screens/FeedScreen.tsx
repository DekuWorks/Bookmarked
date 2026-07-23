import { useCallback, useRef, useState } from "react";
import { ScrollView, useWindowDimensions, View, type LayoutChangeEvent } from "react-native";
import { BrandTopHeader } from "../components/BrandTopHeader";
import { FeedTabPanel } from "../components/FeedTabPanel";
import { ScreenGradientWash } from "../components/ScreenGradientWash";
import { SegmentedTabs } from "../components/SegmentedTabs";
import { useTabBarScroll } from "../navigation/TabBarScroll";
import type { FeedTab } from "../hooks/useFeed";

const TAB_OPTIONS: { id: FeedTab; label: string }[] = [
  { id: "for-you", label: "For You" },
  { id: "following", label: "Following" },
  { id: "clubs", label: "Book Clubs" },
];

/** Conservative estimate until BrandTopHeader is measured (tabs make Feed header taller). */
const FEED_WASH_HEIGHT_RATIO = 0.18;

export function FeedScreen() {
  const { width } = useWindowDimensions();
  const pagerRef = useRef<ScrollView>(null);
  const [tab, setTab] = useState<FeedTab>("for-you");
  const [headerHeight, setHeaderHeight] = useState(0);
  const { onScroll } = useTabBarScroll();

  const onHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    setHeaderHeight((prev) => (prev === next ? prev : next));
  }, []);

  const selectTab = useCallback(
    (next: FeedTab) => {
      const index = TAB_OPTIONS.findIndex((option) => option.id === next);
      setTab(next);
      pagerRef.current?.scrollTo({ x: index * width, animated: true });
    },
    [width]
  );

  return (
    <View className="flex-1 bg-background">
      <ScreenGradientWash
        height={headerHeight > 0 ? headerHeight : undefined}
        heightRatio={FEED_WASH_HEIGHT_RATIO}
      />
      <View onLayout={onHeaderLayout}>
        <BrandTopHeader>
          <SegmentedTabs
            className="mt-3"
            equalWidth
            options={TAB_OPTIONS}
            value={tab}
            onChange={selectTab}
          />
        </BrandTopHeader>
      </View>

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        decelerationRate="fast"
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          const next = TAB_OPTIONS[index]?.id;
          if (next && next !== tab) setTab(next);
        }}
        style={{ flex: 1 }}
      >
        {TAB_OPTIONS.map((option) => (
          <FeedTabPanel key={option.id} tab={option.id} width={width} onScroll={onScroll} />
        ))}
      </ScrollView>
    </View>
  );
}
