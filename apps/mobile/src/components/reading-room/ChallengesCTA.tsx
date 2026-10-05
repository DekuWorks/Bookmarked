import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { withOriginQuery } from "../../../../../packages/utils/navigationOrigin";
import { OVERVIEW_CHALLENGES_COPY } from "../../../../../packages/utils/overviewCopy";

export function ChallengesCTA() {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={OVERVIEW_CHALLENGES_COPY.title}
      onPress={() =>
        router.push(withOriginQuery("/challenges", { origin: "reading_room_overview" }) as never)
      }
      className="flex-row items-center gap-3 rounded-2xl border border-brand-border bg-surface p-4 active:opacity-80"
    >
      <Ionicons name="trophy-outline" size={32} color="#B89DBB" />
      <View className="min-w-0 flex-1">
        <Text className="text-xl font-semibold text-puce-red">{OVERVIEW_CHALLENGES_COPY.title}</Text>
        <Text className="mt-1 text-sm text-ink-muted">{OVERVIEW_CHALLENGES_COPY.subtitle}</Text>
      </View>
      <View className="flex-row items-end gap-1">
        <View className="h-10 w-3 rounded-sm bg-[#8b6f52]" />
        <View className="h-12 w-3 rounded-sm bg-puce-red" />
        <View className="h-9 w-3 rounded-sm bg-primary" />
      </View>
    </Pressable>
  );
}
