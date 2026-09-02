import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { BookCover } from "./BookCover";
import { ProgressBar } from "./ProgressBar";
import { SERIF_DISPLAY_FONT } from "../constants/theme";

type Props = {
  bookId?: string | null;
  title?: string | null;
  author?: string | null;
  coverUrl?: string | null;
  progressPercent?: number | null;
  format?: "book" | "ebook" | "audiobook" | null;
  widthClassName?: string;
  coverSizeClassName?: string;
  /** Pixel width; when set, wins over `widthClassName`. */
  frameStyle?: { width: number };
  /** Pixel cover frame; when set, wins over `coverSizeClassName`. */
  coverSizeStyle?: { width: number; height: number };
};

/** Tappable book cover tile that deep-links to the book screen. */
export function CoverTile({
  bookId,
  title,
  author,
  coverUrl,
  progressPercent,
  format,
  widthClassName = "w-24",
  coverSizeClassName = "w-24 h-36",
  frameStyle,
  coverSizeStyle,
}: Props) {
  const router = useRouter();
  return (
    <Pressable
      disabled={!bookId}
      onPress={() => bookId && router.push(`/book/${bookId}`)}
      className={`${frameStyle ? "" : widthClassName} active:opacity-80`.trim()}
      style={frameStyle}
    >
      <View className="relative">
        <BookCover
          url={coverUrl}
          title={title}
          sizeClassName={coverSizeStyle ? undefined : coverSizeClassName}
          sizeStyle={coverSizeStyle}
        />
        {format === "audiobook" ? (
          <View className="absolute bottom-1 right-1 rounded-full bg-puce-red/90 px-1.5 py-0.5">
            <Text className="text-[10px] font-semibold text-white">🎧</Text>
          </View>
        ) : null}
      </View>
      {progressPercent != null && progressPercent > 0 ? (
        <View className="mt-1.5">
          <ProgressBar percent={progressPercent} />
        </View>
      ) : null}
      <Text
        className="mt-1.5 text-sm leading-snug text-ink"
        numberOfLines={2}
        style={{ fontFamily: SERIF_DISPLAY_FONT, fontWeight: "800" }}
      >
        {title ?? "Untitled"}
      </Text>
      {author ? (
        <Text className="mt-0.5 text-xs leading-snug text-ink-muted" numberOfLines={1}>
          {author}
        </Text>
      ) : null}
    </Pressable>
  );
}
