import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ShelfPreviewRow } from "./ShelfPreviewRow";
import type { ShelfGroup } from "../../services/library";
import { withOriginQuery } from "../../../../../packages/utils/navigationOrigin";
import { OVERVIEW_SECTION_TITLES } from "../../../../../packages/utils/overviewCopy";
import {
  OVERVIEW_PREVIEW_SHELVES,
  previewShelfItems,
} from "../../../../../packages/utils/overviewShelfPreview";

type Props = {
  shelves: ShelfGroup[];
};

export function ShelfPreviewSection({ shelves }: Props) {
  const router = useRouter();

  return (
    <View className="rounded-2xl border border-brand-border bg-surface p-3">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-xl font-semibold text-puce-red">{OVERVIEW_SECTION_TITLES.shelves}</Text>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={OVERVIEW_SECTION_TITLES.seeAllShelves}
          onPress={() =>
            router.push(withOriginQuery("/library", { origin: "reading_room_overview" }) as never)
          }
          className="min-h-11 justify-center px-1"
        >
          <Text className="text-sm font-semibold text-primary-dark">
            {OVERVIEW_SECTION_TITLES.seeAllShelves}
          </Text>
        </Pressable>
      </View>
      <View className="gap-4">
        {OVERVIEW_PREVIEW_SHELVES.map((shelf) => {
          const items = shelves.find((group) => group.status === shelf.status)?.items ?? [];
          return (
            <ShelfPreviewRow
              key={shelf.status}
              title={shelf.title}
              count={items.length}
              items={previewShelfItems(items)}
            />
          );
        })}
      </View>
    </View>
  );
}
