import { Text, View } from "react-native";
import { ShelfIcon } from "./ShelfIcon";
import type { ShelfIconId } from "../constants/shelfIcons";

type Props = {
  id: ShelfIconId;
  title: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  titleClassName?: string;
};

/** Inline shelf icon + title for headers and section labels. */
export function ShelfTitleRow({
  id,
  title,
  size = "md",
  className,
  titleClassName = "text-base font-bold text-puce-red",
}: Props) {
  return (
    <View className={`flex-row items-center gap-2 ${className ?? ""}`}>
      <ShelfIcon id={id} size={size} labeled />
      <Text className={titleClassName} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}
