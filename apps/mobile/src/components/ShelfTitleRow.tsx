import { Text, View } from "react-native";
import { ShelfIcon } from "./ShelfIcon";
import type { ShelfIconId, ShelfIconSize } from "../constants/shelfIcons";
import { SERIF_DISPLAY_FONT } from "../constants/theme";

type Props = {
  id?: ShelfIconId;
  iconKey?: string | null;
  title: string;
  size?: ShelfIconSize;
  className?: string;
  titleClassName?: string;
};

/**
 * Borderless shelf icon + title. Icon sits beside the first title line;
 * the icon+title group is vertically centered as a unit in its parent.
 */
export function ShelfTitleRow({
  id,
  iconKey,
  title,
  size = "medium",
  className,
  titleClassName = "text-xl text-puce-red",
}: Props) {
  return (
    <View className={`flex-row items-center gap-2 ${className ?? ""}`}>
      {id ? (
        <ShelfIcon id={id} size={size} labeled />
      ) : (
        <ShelfIcon iconKey={iconKey} size={size} labeled />
      )}
      <Text
        className={titleClassName}
        numberOfLines={2}
        style={{
          fontFamily: SERIF_DISPLAY_FONT,
          fontWeight: "800",
          flexShrink: 1,
          lineHeight: size === "large" ? 36 : size === "medium" ? 28 : 22,
        }}
      >
        {title}
      </Text>
    </View>
  );
}
