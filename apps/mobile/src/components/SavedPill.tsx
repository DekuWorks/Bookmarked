import { Text, View } from "react-native";
import type { ShelfStatus } from "../types";
import { ShelfIcon } from "./ShelfIcon";

const SHELF_SHORT: Record<ShelfStatus, string> = {
  want_to_read: "TBR",
  currently_reading: "Reading",
  read: "Read",
};

/** "saved to {shelf}" pill shown on saved books (IMG_5362 / IMG_5361). */
export function SavedPill({ shelf }: { shelf: ShelfStatus }) {
  return (
    <View className="flex-row items-center gap-1.5 self-start rounded-full bg-primary/20 px-3 py-1">
      <ShelfIcon id={shelf} size="xs" />
      <Text className="text-xs font-semibold text-puce-red">saved to {SHELF_SHORT[shelf]}</Text>
    </View>
  );
}
