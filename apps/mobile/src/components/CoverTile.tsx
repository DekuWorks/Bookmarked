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
  widthClassName?: string;
  coverSizeClassName?: string;
};

/** Tappable book cover tile that deep-links to the book screen. */
export function CoverTile({
  bookId,
  title,
  author,
  coverUrl,
  progressPercent,
  widthClassName = "w-24",
  coverSizeClassName = "w-24 h-36",
}: Props) {
  const router = useRouter();
  return (
    <Pressable
      disabled={!bookId}
      onPress={() => bookId && router.push(`/book/${bookId}`)}
      className={`${widthClassName} active:opacity-80`}
    >
      <BookCover url={coverUrl} title={title} sizeClassName={coverSizeClassName} />
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
