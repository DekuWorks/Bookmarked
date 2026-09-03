import { useRouter } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";
import { SavedBookBadge, SAVED_BOOK_BADGE_INSET, SAVED_BOOK_BADGE_Z } from "../SavedBookBadge";

const SPINE_COLORS = ["bg-puce-red", "bg-primary", "bg-primary/80", "bg-puce-red/80"];

function hashTitle(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function spineWidth(pageCount?: number | null): number {
  if (!pageCount || pageCount < 180) return 44;
  if (pageCount < 320) return 50;
  if (pageCount < 480) return 58;
  return 66;
}

type Props = {
  bookId?: string | null;
  title?: string | null;
  author?: string | null;
  coverUrl?: string | null;
  pageCount?: number | null;
  saved?: boolean;
};

export function BookSpine({ bookId, title, author, coverUrl, pageCount, saved }: Props) {
  const router = useRouter();
  const label = title?.trim() || "Untitled";
  const width = spineWidth(pageCount);
  const spineColor = SPINE_COLORS[hashTitle(label) % SPINE_COLORS.length];

  return (
    <Pressable
      disabled={!bookId}
      onPress={() => bookId && router.push(`/book/${bookId}`)}
      className="items-center active:opacity-80"
      style={{ width }}
    >
      <View
        className="relative overflow-hidden rounded-t-sm border border-brand-border/40"
        style={{ width, height: 184 }}
      >
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} className="absolute inset-0" resizeMode="cover" />
        ) : (
          <View className={`absolute inset-0 ${spineColor}`} />
        )}
        <View className="absolute inset-0 bg-black/65" />
        <View className="absolute inset-0 items-center justify-center px-1.5 py-3">
          <Text
            numberOfLines={7}
            className="text-center text-[10px] font-extrabold leading-3 text-white"
            style={{ transform: [{ rotate: "-90deg" }], width: 156 }}
          >
            {label}
          </Text>
        </View>
        {saved ? (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: SAVED_BOOK_BADGE_INSET,
              left: SAVED_BOOK_BADGE_INSET,
              zIndex: SAVED_BOOK_BADGE_Z,
            }}
          >
            <SavedBookBadge isSaved size="small" />
          </View>
        ) : null}
      </View>
      {author ? (
        <Text className="mt-1 max-w-full text-center text-[10px] text-ink-muted" numberOfLines={1}>
          {author}
        </Text>
      ) : null}
    </Pressable>
  );
}
