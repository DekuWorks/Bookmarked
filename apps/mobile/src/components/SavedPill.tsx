import { Text, View } from "react-native";
import type { ShelfStatus } from "../types";
import { ShelfIcon } from "./ShelfIcon";

const SHELF_SHORT: Record<ShelfStatus, string> = {
  want_to_read: "TBR",
  currently_reading: "Reading",
  read: "Finished",
  dnf: "DNF",
};

/** "saved to {shelf}" pill shown on saved books (IMG_5362 / IMG_5361). */
export function SavedPill({
  shelf,
  label,
}: {
  shelf?: ShelfStatus | null;
  label?: string;
}) {
  const text = label?.trim() || (shelf ? SHELF_SHORT[shelf] : "");
  if (!text) return null;

  return (
    <View className="flex-row items-center gap-2 self-start rounded-full bg-primary/20 px-3 py-1">
      {shelf ? <ShelfIcon id={shelf} size="small" /> : null}
      <Text className="text-xs font-semibold leading-tight text-puce-red">
        saved to {text}
      </Text>
    </View>
  );
}
