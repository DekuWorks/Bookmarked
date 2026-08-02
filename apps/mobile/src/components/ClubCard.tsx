import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { BookCover } from "./BookCover";
import { Avatar } from "./Avatar";
import type { BookClubSummary } from "../types";
import {
  roleLabel,
  visibilityLabel,
} from "../../../../packages/utils/clubPermissions";

export function ClubCard({ club }: { club: BookClubSummary }) {
  const router = useRouter();
  const memberLabel = `${club.member_count} member${club.member_count === 1 ? "" : "s"}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${club.name}, ${visibilityLabel(club.visibility)}, ${memberLabel}`}
      onPress={() => router.push(`/(app)/clubs/${club.id}`)}
      className="mb-3 min-h-[44px] flex-row gap-4 rounded-2xl border border-brand-border bg-surface p-4 active:opacity-80"
    >
      <View className="h-16 w-16">
        {club.image_url ? (
          <Avatar url={club.image_url} name={club.name} size={64} />
        ) : club.current_book ? (
          <BookCover
            url={club.current_book.cover_url}
            title={club.current_book.title}
            sizeClassName="w-16 h-24"
          />
        ) : (
          <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/25">
            <Text className="text-lg font-bold text-puce-red">
              {club.name.trim().slice(0, 1).toUpperCase() || "C"}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-1">
        <View className="flex-row items-start gap-2">
          <Text className="flex-1 font-semibold text-puce-red" numberOfLines={2}>
            {club.name}
          </Text>
          {club.visibility !== "public" ? (
            <Text className="text-[10px] font-semibold uppercase text-ink-muted">
              {visibilityLabel(club.visibility)}
            </Text>
          ) : null}
        </View>

        {club.description ? (
          <Text className="mt-1 text-sm text-ink-muted" numberOfLines={2}>
            {club.description}
          </Text>
        ) : null}

        <View className="mt-2 flex-row flex-wrap items-center gap-x-3 gap-y-1">
          <Text className="text-xs text-ink-muted">{memberLabel}</Text>
          {club.current_book ? (
            <Text className="flex-1 text-xs text-ink-muted" numberOfLines={1}>
              Reading <Text className="font-medium text-ink">{club.current_book.title}</Text>
            </Text>
          ) : null}
          {club.viewer_is_member ? (
            <View className="rounded-full bg-primary/20 px-2 py-0.5">
              <Text className="text-[11px] font-semibold text-puce-red">
                {club.viewer_role ? roleLabel(club.viewer_role) : "Joined"}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
