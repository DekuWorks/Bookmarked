import { useEffect, useRef, useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { BookCover } from "../BookCover";
import type { LibraryBookRow } from "../../services/library";
import { withOriginQuery } from "../../../../../packages/utils/navigationOrigin";
import { bookCountLabel, SHELF_PREVIEW_COVER } from "../../../../../packages/utils/overviewShelfPreview";
import {
  READING_ROOM_MOTION,
  shelfEnterIds,
  shelfExitIds,
} from "../../../../../packages/utils/readingRoomMotion";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

type Props = {
  title: string;
  count: number;
  items: LibraryBookRow[];
};

function ShelfCoverButton({
  item,
  frame,
  artWidth,
  artHeight,
  entering,
  exiting,
  allowHover,
}: {
  item: LibraryBookRow;
  frame: number;
  artWidth: number;
  artHeight: number;
  entering: boolean;
  exiting: boolean;
  allowHover: boolean;
}) {
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();
  const book = item.books;
  const bookTitle = book?.title ?? "Untitled";
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const opacity = useSharedValue(entering ? 0 : 1);
  const shift = useSharedValue(entering ? 8 : 0);
  const scale = useSharedValue(entering ? 0.96 : 1);
  const duration = reducedMotion ? 0 : READING_ROOM_MOTION.shelfPlaceMs;

  useEffect(() => {
    if (exiting) {
      opacity.value = withTiming(0, { duration, easing: Easing.out(Easing.cubic) });
      shift.value = withTiming(6, { duration, easing: Easing.out(Easing.cubic) });
      scale.value = withTiming(0.96, { duration, easing: Easing.out(Easing.cubic) });
      return;
    }
    if (!entering) return;
    opacity.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic) });
    shift.value = withTiming(0, { duration, easing: Easing.out(Easing.cubic) });
    scale.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic) });
  }, [duration, entering, exiting, opacity, scale, shift]);

  const motion = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: shift.value }, { scale: scale.value }],
  }));

  if (!book?.id) return null;
  const lift = allowHover && hovered && !pressed ? -READING_ROOM_MOTION.shelfHoverLiftPx : 0;
  const hoverScale = allowHover && hovered && !pressed ? READING_ROOM_MOTION.shelfHoverScale : 1;

  return (
    <Animated.View style={motion}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={book.author ? `${bookTitle}, ${book.author}` : bookTitle}
        accessibilityState={{ disabled: exiting }}
        disabled={exiting}
        onPress={() =>
          router.push(withOriginQuery(`/book/${book.id}`, { origin: "reading_room_overview" }) as never)
        }
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={{
          width: frame,
          height: frame,
          alignItems: "center",
          justifyContent: "flex-end",
          overflow: "visible",
          opacity: pressed ? 0.85 : 1,
          transform: [{ translateY: lift }, { scale: pressed ? 0.98 : hoverScale }],
        }}
      >
        <BookCover
          url={book.cover_url}
          title={bookTitle}
          resizeMode="contain"
          accessible={false}
          sizeStyle={{ width: artWidth, height: artHeight }}
          saved
          badgeSize="small"
        />
      </Pressable>
    </Animated.View>
  );
}

export function ShelfPreviewRow({ title, count, items }: Props) {
  const { width: viewportWidth } = useWindowDimensions();
  const reducedMotion = usePrefersReducedMotion();
  const compact = viewportWidth < 768;
  const stacked = viewportWidth < 480;
  const maxFrame = compact ? SHELF_PREVIEW_COVER.framePx : SHELF_PREVIEW_COVER.tabletFramePx;
  const shelfWidth = viewportWidth - 32 - (stacked ? 0 : 108);
  const fitted = Math.floor((shelfWidth - 16 - 8 * 4) / 5);
  const frame = Math.max(32, Math.min(maxFrame, fitted || maxFrame));
  const artWidth = Math.round(frame * (SHELF_PREVIEW_COVER.widthPx / SHELF_PREVIEW_COVER.framePx));
  const artHeight = Math.round(artWidth * (SHELF_PREVIEW_COVER.heightPx / SHELF_PREVIEW_COVER.widthPx));
  const previousIds = useRef<string[] | null>(null);
  const cache = useRef(new Map<string, LibraryBookRow>());
  const [entering, setEntering] = useState<string[]>([]);
  const [exiting, setExiting] = useState<LibraryBookRow[]>([]);
  const idKey = items.map((item) => item.id).join("|");

  useEffect(() => {
    const nextIds = idKey ? idKey.split("|") : [];
    const previous = previousIds.current;
    const enter = shelfEnterIds(previous, nextIds);
    const leave = shelfExitIds(previous, nextIds);
    previousIds.current = nextIds;
    if (previous != null && !reducedMotion && (enter.length > 0 || leave.length > 0)) {
      setEntering(enter);
      setExiting(
        leave
          .map((id) => cache.current.get(id))
          .filter((item): item is LibraryBookRow => Boolean(item))
      );
    }
    for (const item of items) cache.current.set(item.id, item);
    if (enter.length === 0 && leave.length === 0) return;
    const timer = setTimeout(() => {
      setEntering([]);
      setExiting([]);
    }, READING_ROOM_MOTION.shelfPlaceMs);
    return () => clearTimeout(timer);
  }, [idKey, items, reducedMotion]);

  return (
    <View className={stacked ? "gap-2" : "flex-row items-end gap-3"}>
      <View className={stacked ? "pb-1" : "w-24 pb-3"}>
        <Text className="font-semibold text-puce-red">{title}</Text>
        <Text className="text-sm text-ink-muted">{bookCountLabel(count)}</Text>
      </View>
      <View className="min-w-0 flex-1">
        <View className="min-h-16 flex-row items-end gap-2 bg-primary/5 px-2 pt-2">
          {items.map((item) => (
            <ShelfCoverButton
              key={item.id}
              item={item}
              frame={frame}
              artWidth={artWidth}
              artHeight={artHeight}
              entering={entering.includes(item.id)}
              exiting={false}
              allowHover={!compact}
            />
          ))}
          {exiting.map((item) => (
            <ShelfCoverButton
              key={`exit-${item.id}`}
              item={item}
              frame={frame}
              artWidth={artWidth}
              artHeight={artHeight}
              entering={false}
              exiting
              allowHover={false}
            />
          ))}
          {count === 0 && exiting.length === 0 ? (
            <Text className="pb-2 text-sm text-ink-muted">No books on this shelf yet.</Text>
          ) : null}
        </View>
        <LinearGradient
          colors={["#c4a882", "#a08060", "#8b6f52"]}
          style={{ height: 12, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }}
        />
      </View>
    </View>
  );
}
