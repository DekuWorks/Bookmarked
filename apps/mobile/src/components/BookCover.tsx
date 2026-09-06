import { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";
import { resolveCoverDisplaySource } from "../../../../packages/utils/mediaDisplayUrl";
import { SavedBookBadge, SAVED_BOOK_BADGE_INSET, SAVED_BOOK_BADGE_Z } from "./SavedBookBadge";

type Props = {
  url?: string | null;
  title?: string | null;
  /** Tailwind width/height classes, e.g. "w-16 h-24". */
  sizeClassName?: string;
  /** Pixel frame; when set, wins over `sizeClassName` dimensions. */
  sizeStyle?: { width: number; height: number };
  /** `contain` shows complete artwork; default `cover` fills the frame. */
  resizeMode?: "cover" | "contain";
  /** Overlay the Bookmarked "B" ribbon (book is saved to a shelf). */
  saved?: boolean;
  /** Optional save toggle — forwarded to SavedBookBadge. */
  onToggleSave?: () => void;
  /** Badge size token. */
  badgeSize?: "small" | "medium" | "large";
  /** Book details / above-fold — request the larger cover variant. */
  priority?: boolean;
};

export function BookCover({
  url,
  title,
  sizeClassName = "w-16 h-24",
  sizeStyle,
  resizeMode = "cover",
  saved,
  onToggleSave,
  badgeSize = "medium",
  priority = false,
}: Props) {
  const source = url?.trim()
    ? resolveCoverDisplaySource(url.trim(), priority ? "detail" : "thumb")
    : null;
  const [displayUrl, setDisplayUrl] = useState(source?.displayUrl ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const next = url?.trim()
      ? resolveCoverDisplaySource(url.trim(), priority ? "detail" : "thumb")
      : null;
    setDisplayUrl(next?.displayUrl ?? null);
    setFailed(false);
  }, [url, priority]);

  const showBadge = Boolean(saved) || Boolean(onToggleSave);
  // Square corners when the ribbon shows so it can sit flush on a straight edge.
  const radiusClass = showBadge ? "rounded-none" : "rounded-md";
  const dimensionClass = sizeStyle ? undefined : sizeClassName;

  const cover = displayUrl && !failed ? (
    <Image
      source={{ uri: displayUrl }}
      className={[dimensionClass, radiusClass, "bg-primary/20"].filter(Boolean).join(" ")}
      style={sizeStyle}
      resizeMode={resizeMode}
      accessibilityLabel={title?.trim() ? `Cover of ${title.trim()}` : "Book cover"}
      onError={() => {
        const next = url?.trim()
          ? resolveCoverDisplaySource(url.trim(), priority ? "detail" : "thumb")
          : null;
        if (next?.fallbackUrl && displayUrl !== next.fallbackUrl) {
          setDisplayUrl(next.fallbackUrl);
          return;
        }
        setFailed(true);
      }}
    />
  ) : (
    <View
      className={[dimensionClass, radiusClass, "bg-primary/25 items-center justify-center p-1"]
        .filter(Boolean)
        .join(" ")}
      style={sizeStyle}
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
