import { Image, Text, View } from "react-native";
import { SavedBookBadge } from "./SavedBookBadge";

type Props = {
  url?: string | null;
  title?: string | null;
  /** Tailwind width/height classes, e.g. "w-16 h-24". */
  sizeClassName?: string;
  /** Overlay the Bookmarked "B" ribbon (book is saved to a shelf). */
  saved?: boolean;
  /** Badge size token. */
  badgeSize?: "small" | "medium" | "large";
};

export function BookCover({
  url,
  title,
  sizeClassName = "w-16 h-24",
  saved,
  badgeSize = "medium",
}: Props) {
  const cover = url ? (
    <Image
      source={{ uri: url }}
      className={`${sizeClassName} rounded-md bg-primary/20`}
      resizeMode="cover"
      accessibilityLabel={title?.trim() ? `Cover of ${title.trim()}` : "Book cover"}
    />
  ) : (
    <View
      className={`${sizeClassName} rounded-md bg-primary/25 items-center justify-center p-1`}
    >
      <Text numberOfLines={3} className="text-center text-[10px] font-medium text-puce-red">
        {title?.trim() || "No cover"}
      </Text>
    </View>
  );

  if (!saved) return cover;

  return (
    <View className="relative" style={{ overflow: "visible" }}>
      {cover}
      <View className="absolute" style={{ top: -4, right: -4, overflow: "visible" }}>
        <SavedBookBadge size={badgeSize} />
      </View>
    </View>
  );
}
