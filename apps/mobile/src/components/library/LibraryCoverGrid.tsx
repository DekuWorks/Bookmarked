import { useState } from "react";
import { useWindowDimensions, View, type LayoutChangeEvent } from "react-native";
import {
  LIBRARY_GRID_GAP,
  libraryGridLayout,
} from "../../../../../packages/utils/libraryFilters";
import { CoverTile } from "../CoverTile";

const COVER_ASPECT = 3 / 2;

export type LibraryCoverGridItem = {
  id: string;
  bookId?: string | null;
  title?: string | null;
  author?: string | null;
  coverUrl?: string | null;
  format?: "book" | "ebook" | "audiobook" | null;
  saved?: boolean;
};

type Props = {
  items: LibraryCoverGridItem[];
  gap?: number;
};

export function LibraryCoverGrid({ items, gap = LIBRARY_GRID_GAP }: Props) {
  const { width: sceneWidth } = useWindowDimensions();
  const [contentWidth, setContentWidth] = useState(0);
  const { tileWidth, gap: resolvedGap } = libraryGridLayout(contentWidth, true, {
    gap,
    columnWidth: sceneWidth,
  });

  function onLayout(event: LayoutChangeEvent) {
    const next = Math.round(event.nativeEvent.layout.width);
    setContentWidth((prev) => (prev === next ? prev : next));
  }

  return (
    <View onLayout={onLayout} className="w-full flex-row flex-wrap" style={{ gap: resolvedGap }}>
      {contentWidth <= 0 || tileWidth <= 0
        ? null
        : items.map((item) => (
            <CoverTile
              key={item.id}
              bookId={item.bookId}
              title={item.title}
              author={item.author}
              coverUrl={item.coverUrl}
              format={item.format}
              saved={item.saved}
              frameStyle={{ width: tileWidth }}
              coverSizeStyle={{
                width: tileWidth,
                height: Math.round(tileWidth * COVER_ASPECT),
              }}
            />
          ))}
    </View>
  );
}
