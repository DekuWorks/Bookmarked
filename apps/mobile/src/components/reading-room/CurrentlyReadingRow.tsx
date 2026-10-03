import { useState } from "react";
import { Text, View } from "react-native";
import { AddBookCoverCard } from "./AddBookCoverCard";
import { CurrentlyReadingAddSheet } from "./CurrentlyReadingAddSheet";
import { CoverTile } from "../CoverTile";
import { trackProductEvent } from "../../services/productAnalytics";
import type { LibraryBookRow } from "../../services/library";
import { CURRENTLY_READING_ADD_EVENTS } from "../../../../../packages/utils/currentlyReadingAdd";
import { OVERVIEW_EMPTY_COPY } from "../../../../../packages/utils/overviewCopy";
import {
  CURRENTLY_READING_CARD_SIZE,
  currentlyReadingCoverBoxStyle,
} from "../../../../../packages/utils/currentlyReadingCard";
import { resolveTrackingFormat } from "../../../../../packages/utils/listeningTime";

type Props = {
  userId: string;
  items: LibraryBookRow[];
  onRefresh: () => void;
};

export function CurrentlyReadingRow({ userId, items, onRefresh }: Props) {
  const [addOpen, setAddOpen] = useState(false);

  function openAdd() {
    trackProductEvent(CURRENTLY_READING_ADD_EVENTS.opened);
    setAddOpen(true);
  }

  const cardSize = CURRENTLY_READING_CARD_SIZE.native;
  const coverSize = currentlyReadingCoverBoxStyle("native");

  return (
    <View>
      {items.length === 0 ? (
        <View className="items-center gap-3 py-2">
          <Text className="text-center text-sm text-ink-muted">
            {OVERVIEW_EMPTY_COPY.currentlyReading}
          </Text>
          <AddBookCoverCard onPress={openAdd} />
        </View>
      ) : (
        <View className="flex-row flex-wrap items-stretch gap-3">
          {items.map((item) => (
            <View
              key={item.id}
              style={{ width: cardSize.widthPx, height: cardSize.heightPx }}
            >
              <CoverTile
                bookId={item.books?.id}
                title={item.books?.title}
                author={item.books?.author}
                coverUrl={item.books?.cover_url}
                progressPercent={item.progress_percent}
                format={resolveTrackingFormat({
                  userFormat: item.tracking_format,
                  catalogFormat: item.books?.format,
                })}
                frameStyle={{ width: cardSize.widthPx }}
                coverSizeStyle={coverSize}
                priority
              />
            </View>
          ))}
          <AddBookCoverCard onPress={openAdd} />
        </View>
      )}

      <CurrentlyReadingAddSheet
        userId={userId}
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={onRefresh}
      />
    </View>
  );
}
