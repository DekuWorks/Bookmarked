import { Image, Text, View } from "react-native";
import { SavedBookBadge, SAVED_BOOK_BADGE_INSET, SAVED_BOOK_BADGE_Z } from "./SavedBookBadge";

type Props = {
  url?: string | null;
  title?: string | null;
  /** Tailwind width/height classes, e.g. "w-16 h-24". */
  sizeClassName?: string;
  /** Overlay the Bookmarked "B" ribbon (book is saved to a shelf). */
  saved?: boolean;
  /** Optional save toggle — forwarded to SavedBookBadge. */
  onToggleSave?: () => void;
  /** Badge size token. */
  badgeSize?: "small" | "medium" | "large";
};

export function BookCover({
  url,
  title,
  sizeClassName = "w-16 h-24",
  saved,
  onToggleSave,
  badgeSize = "medium",
}: Props) {
  const showBadge = Boolean(saved) || Boolean(onToggleSave);
  // Square corners when the ribbon shows so it can sit flush on a straight edge.
  const radiusClass = showBadge ? "rounded-none" : "rounded-md";

  const cover = url ? (
    <Image
      source={{ uri: url }}
      className={`${sizeClassName} ${radiusClass} bg-primary/20`}
      resizeMode="cover"
      accessibilityLabel={title?.trim() ? `Cover of ${title.trim()}` : "Book cover"}
    />
  ) : (
    <View
      className={`${sizeClassName} ${radiusClass} bg-primary/25 items-center justify-center p-1`}
    >
      <Text numberOfLines={3} className="text-center text-[10px] font-medium text-puce-red">
        {title?.trim() || "No cover"}
      </Text>
    </View>
  );

  if (!showBadge) return cover;

  return (
    <View className="relative" style={{ overflow: "visible" }}>
      {cover}
      <View
        pointerEvents={onToggleSave ? "box-none" : "none"}
        style={{
          position: "absolute",
          top: SAVED_BOOK_BADGE_INSET,
          left: SAVED_BOOK_BADGE_INSET,
          zIndex: SAVED_BOOK_BADGE_Z,
          overflow: "visible",
        }}
      >
        <SavedBookBadge
          isSaved={Boolean(saved)}
          onToggle={onToggleSave}
          size={badgeSize}
        />
      </View>
    </View>
  );
}
