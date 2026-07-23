import { useRouter } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";
import { SavedBookBadge } from "../SavedBookBadge";

const SPINE_COLORS = ["bg-puce-red", "bg-primary", "bg-primary/80", "bg-puce-red/80"];

function hashTitle(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function spineWidth(pageCount?: number | null): number {
  if (!pageCount || pageCount < 180) return 36;
  if (pageCount < 320) return 40;
  if (pageCount < 480) return 44;
  return 48;
}

type Props = {
  bookId?: string | null;
  title?: string | null;
  author?: string | null;
  coverUrl?: string | null;
  pageCount?: number | null;
};

export function BookSpine({ bookId, title, author, coverUrl, pageCount }: Props) {
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
        style={{ width, height: 168 }}
      >
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} className="absolute inset-0" resizeMode="cover" />
        ) : (
          <View className={`absolute inset-0 items-center justify-center px-1 ${spineColor}`}>
            <Text
              numberOfLines={6}
              className="text-center text-[8px] font-semibold text-white"
              style={{ transform: [{ rotate: "-90deg" }], width: 140 }}
            >
              {label}
            </Text>
          </View>
        )}
        <View className="absolute -top-0.5 right-0.5">
          <SavedBookBadge size="small" />
        </View>
      </View>
      {author ? (
        <Text className="mt-1 max-w-full text-center text-[10px] text-ink-muted" numberOfLines={1}>
          {author}
        </Text>
      ) : null}
    </Pressable>
  );
}
