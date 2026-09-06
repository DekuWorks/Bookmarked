import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View, type LayoutChangeEvent } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { BrandTopHeader } from "../components/BrandTopHeader";
import { FeedSearchBar } from "../components/FeedSearchBar";
import { FeedSearchResults } from "../components/FeedSearchResults";
import { FeedTabPanel } from "../components/FeedTabPanel";
import { ScreenGradientWash } from "../components/ScreenGradientWash";
import { SegmentedTabs } from "../components/SegmentedTabs";
import { useTabBarScroll } from "../navigation/TabBarScroll";
import { searchFeed, type FeedSearchResults as FeedSearchData } from "../services/feedSearch";
import { useAuthStore } from "../store/authStore";
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
  const userId = useAuthStore((s) => s.user?.id);
  const params = useLocalSearchParams<{ post?: string; scroll?: string }>();
  const highlightedPostId = typeof params.post === "string" ? params.post.trim() : "";
  const restoreScroll =
    typeof params.scroll === "string" && Number.isFinite(Number(params.scroll))
      ? Number(params.scroll)
      : undefined;
  const [tab, setTab] = useState<FeedTab>("for-you");
  const [headerHeight, setHeaderHeight] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FeedSearchData | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { onScroll } = useTabBarScroll();

  const isSearching = debouncedQuery.trim().length > 0;

  useEffect(() => {
    if (!highlightedPostId) return;
    setTab("for-you");
    pagerRef.current?.scrollTo({ x: 0, animated: false });
  }, [highlightedPostId]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 350);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    if (!userId || !isSearching) {
      setSearchResults(null);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    void searchFeed(debouncedQuery, userId)
      .then(setSearchResults)
      .catch((err) => {
        setSearchError(err instanceof Error ? err.message : "Search failed.");
        setSearchResults({ readers: [], books: [], posts: [], moods: [] });
      })
      .finally(() => setSearchLoading(false));
  }, [userId, debouncedQuery, isSearching]);

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
          <View className="mt-4 w-full">
            <FeedSearchBar value={searchQuery} onChange={setSearchQuery} />
            <View className="mt-2 flex-row flex-wrap gap-2">
              {["#Cozy", "#Dark", "#Funny", "#Romantic"].map((mood) => (
                <Pressable
                  key={mood}
                  onPress={() => setSearchQuery(mood)}
                  className="rounded-full border border-brand-border bg-surface px-3 py-1"
                >
                  <Text className="text-xs font-semibold text-puce-red">{mood}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          {!isSearching ? (
            <SegmentedTabs
              className="mt-4"
              equalWidth
              options={TAB_OPTIONS}
              value={tab}
              onChange={selectTab}
            />
          ) : null}
        </BrandTopHeader>
      </View>

      {isSearching ? (
        <View className="flex-1 px-4 pt-2">
          <FeedSearchResults
            query={debouncedQuery.trim()}
            results={searchResults}
            loading={searchLoading}
            error={searchError}
          />
        </View>
      ) : (
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
          <FeedTabPanel
            key={option.id}
            tab={option.id}
            width={width}
            onScroll={onScroll}
            highlightedPostId={option.id === "for-you" ? highlightedPostId || undefined : undefined}
            restoreScroll={restoreScroll}
          />
        ))}
      </ScrollView>
      )}
    </View>
  );
}
