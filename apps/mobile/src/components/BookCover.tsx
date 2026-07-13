import { Image, Text, View } from "react-native";
import { BookmarkRibbon } from "./BookmarkRibbon";

type Props = {
  url?: string | null;
  title?: string | null;
  /** Tailwind width/height classes, e.g. "w-16 h-24". */
  sizeClassName?: string;
  /** Overlay the Bookmarked "B" ribbon (book is saved to a shelf). */
  saved?: boolean;
  /** Ribbon size in px. */
  ribbonSize?: number;
};

export function BookCover({
  url,
  title,
  sizeClassName = "w-16 h-24",
  saved,
  ribbonSize = 20,
}: Props) {
  const cover = url ? (
    <Image
      source={{ uri: url }}
      className={`${sizeClassName} rounded-md bg-primary/20`}
      resizeMode="cover"
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
    <View className="relative">
      {cover}
      <View className="absolute -top-1 right-1">
        <BookmarkRibbon size={ribbonSize} />
      </View>
    </View>
  );
}
