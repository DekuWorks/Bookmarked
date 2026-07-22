import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Button } from "../../src/components/Button";
import { LoadingState } from "../../src/components/LoadingState";
import { ReadingGoalPanel } from "../../src/components/ReadingGoalPanel";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { useProfile } from "../../src/hooks/useProfile";
import { getUserLibraryBooks } from "../../src/services/library";
import { computeReadingGoal } from "../../src/services/readingGoal";
import { supabase } from "../../src/services/supabase";
import { useAuthStore } from "../../src/store/authStore";

export default function SettingsRoute() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const { data: profile } = useProfile();

  const library = useQuery({
    queryKey: ["library", userId],
    queryFn: () => getUserLibraryBooks(userId as string),
    enabled: Boolean(userId),
  });

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  }

  if (!profile || library.isLoading) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Account settings" />
        <LoadingState message="Loading settings…" />
      </View>
    );
  }

  const goal = computeReadingGoal(library.data ?? [], profile.yearly_reading_goal ?? null);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Account settings" />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-sm text-ink-muted mb-6">
          Manage your account, notifications, reading goal, and privacy.
        </Text>

        <View className="gap-2 mb-6">
          <SettingsLink
            icon="✏️"
            label="Edit profile"
            description="Name, bio, avatar, and favorite genres"
            onPress={() => router.push("/(auth)/profile-setup")}
          />
          <SettingsLink
            icon="🔔"
            label="Notifications"
            description="In-app and push notification preferences"
            onPress={() => router.push("/notifications")}
          />
          <SettingsLink
            icon="🔒"
            label="Shelf privacy"
            description="Who can see each shelf on your profile"
            onPress={() => router.push("/shelf-privacy")}
          />
        </View>

        <View className="rounded-2xl border border-brand-border bg-surface p-4 mb-6">
          <Text className="text-base font-semibold text-puce-red mb-3">Reading goal</Text>
          <ReadingGoalPanel status={goal} />
        </View>

        <Button title="Log out" variant="ghost" onPress={() => void signOut()} />
      </ScrollView>
    </View>
  );
}

function SettingsLink({
  icon,
  label,
  description,
  onPress,
}: {
  icon: string;
  label: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-brand-border bg-surface px-4 py-3 active:opacity-80"
    >
      <Text className="text-lg">{icon}</Text>
      <View className="flex-1">
        <Text className="font-medium text-ink">{label}</Text>
        <Text className="text-xs text-ink-muted mt-0.5">{description}</Text>
      </View>
      <Text className="text-ink-muted">›</Text>
    </Pressable>
  );
}
