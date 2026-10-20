import { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";
import {
  BOOK_COVER_RADIUS_PX,
  coverRibbonSize,
  coverWidthFromClass,
} from "../../../../packages/utils/bookCover";
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
  /** Overlay the Bookmarked ribbon. Omit to show it. Pass false to hide it. */
  saved?: boolean;
  /** Optional save toggle — forwarded to SavedBookBadge. */
  onToggleSave?: () => void;
  /** Badge size token. */
  badgeSize?: "small" | "medium" | "large";
  /** Book details / above-fold — request the larger cover variant. */
  priority?: boolean;
  /** When false, the parent control owns the accessible name. */
  accessible?: boolean;
  accessibilityLabel?: string;
};

export function BookCover({
  url,
  title,
  sizeClassName = "w-16 h-24",
  sizeStyle,
  resizeMode = "cover",
  saved,
  onToggleSave,
  badgeSize,
  priority = false,
  accessible = true,
  accessibilityLabel,
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

  const showBadge = saved !== false || Boolean(onToggleSave);
  const dimensionClass = sizeStyle ? undefined : sizeClassName;
  const frameWidth = sizeStyle?.width ?? coverWidthFromClass(sizeClassName);
  const ribbonSize = coverRibbonSize(frameWidth, badgeSize);
  const clip = { borderRadius: BOOK_COVER_RADIUS_PX, overflow: "hidden" as const };

  const art = displayUrl && !failed ? (
    <Image
      source={{ uri: displayUrl }}
      className="h-full w-full bg-primary/20"
      style={sizeStyle ? { width: sizeStyle.width, height: sizeStyle.height } : undefined}
      resizeMode={resizeMode}
      accessible={accessible}
      accessibilityLabel={
        accessible
          ? accessibilityLabel ?? (title?.trim() ? `Cover of ${title.trim()}` : "Book cover")
          : undefined
      }
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
    <View className="h-full w-full items-center justify-center bg-primary/25 p-1">
      <Text numberOfLines={3} className="text-center text-[10px] font-medium text-puce-red">
        {title?.trim() || "No cover"}
      </Text>
    </View>
  );

  return (
    <View className="relative" style={{ overflow: "visible" }}>
      <View className={dimensionClass} style={sizeStyle ? { ...sizeStyle, ...clip } : clip}>
        {art}
      </View>
      {showBadge ? (
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
          <SavedBookBadge isSaved={saved !== false} onToggle={onToggleSave} size={ribbonSize} />
        </View>
      ) : null}
    </View>
  );
}
