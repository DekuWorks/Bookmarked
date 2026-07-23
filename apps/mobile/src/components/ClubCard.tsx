import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { BookCover } from "./BookCover";
import { Avatar } from "./Avatar";
import type { BookClubSummary } from "../types";

export function ClubCard({ club }: { club: BookClubSummary }) {
  const router = useRouter();
  const memberLabel = `${club.member_count} member${club.member_count === 1 ? "" : "s"}`;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/(app)/clubs/${club.id}`)}
      className="flex-row gap-4 rounded-2xl border border-brand-border bg-surface p-4 mb-3 active:opacity-80"
    >
      <View className="w-16 h-16">
        {club.image_url ? (
          <Avatar url={club.image_url} name={club.name} size={64} />
        ) : club.current_book ? (
          <BookCover
            url={club.current_book.cover_url}
            title={club.current_book.title}
            sizeClassName="w-16 h-24"
          />
        ) : (
          <View className="w-16 h-16 rounded-full bg-primary/25 items-center justify-center">
            <Text className="text-2xl">📚</Text>
          </View>
        )}
      </View>

      <View className="flex-1">
        <View className="flex-row items-start gap-2">
          <Text className="flex-1 font-semibold text-puce-red" numberOfLines={2}>
            {club.name}
          </Text>
          {club.visibility === "private" ? (
            <Text className="text-[10px] font-semibold uppercase text-ink-muted">Private</Text>
          ) : null}
        </View>

        {club.description ? (
          <Text className="text-sm text-ink-muted mt-1" numberOfLines={2}>
            {club.description}
          </Text>
        ) : null}

        <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1 mt-2">
          <Text className="text-xs text-ink-muted">{memberLabel}</Text>
          {club.current_book ? (
            <Text className="text-xs text-ink-muted flex-1" numberOfLines={1}>
              Reading <Text className="text-ink font-medium">{club.current_book.title}</Text>
            </Text>
          ) : null}
          {club.viewer_is_member ? (
            <View className="rounded-full bg-primary/20 px-2 py-0.5">
              <Text className="text-[11px] font-semibold text-puce-red">
                {club.viewer_role === "owner" ? "Owner" : "Joined"}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
