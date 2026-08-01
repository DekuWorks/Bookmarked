import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Button } from "../../src/components/Button";
import { LibraryImportPanel } from "../../src/components/LibraryImportPanel";
import { SeriesImportPanel } from "../../src/components/SeriesImportPanel";
import { LoadingState } from "../../src/components/LoadingState";
import { ReadingGoalPanel } from "../../src/components/ReadingGoalPanel";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { useProfile } from "../../src/hooks/useProfile";
import { getUserLibraryBooks } from "../../src/services/library";
import { deleteAccount } from "../../src/services/moderation";
import { computeReadingGoal } from "../../src/services/readingGoal";
import { supabase } from "../../src/services/supabase";
import { ThemePreferencePanel } from "../../src/components/ThemePreferencePanel";
import { useAuthStore } from "../../src/store/authStore";
import { useState } from "react";

export default function SettingsRoute() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const { data: profile } = useProfile();
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const library = useQuery({
    queryKey: ["library", userId],
    queryFn: () => getUserLibraryBooks(userId as string),
    enabled: Boolean(userId),
  });

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  }

  async function handleDeleteAccount() {
    if (deleteConfirm.trim().toUpperCase() !== "DELETE") {
      Alert.alert("Confirmation required", 'Type DELETE to confirm account deletion.');
      return;
    }

    Alert.alert(
      "Delete account permanently?",
      "This removes your profile, library, reviews, posts, messages, and all other data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            const result = await deleteAccount();
            setDeleting(false);
            if (result.error) {
              Alert.alert("Couldn't delete account", result.error);
              return;
            }
            router.replace("/(auth)/login");
          },
        },
      ]
    );
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

        <ThemePreferencePanel />

        <View className="gap-2 mb-6">
          <SettingsLink
            icon="✨"
            label="Bookmarked Premium"
            description="Advanced analytics, AI insights, and early access"
            onPress={() => router.push("/upgrade")}
          />
          <SettingsLink
            icon="✏️"
            label="Edit profile"
            description="Name, bio, avatar, and favorite genres"
            onPress={() => router.push("/profile-edit")}
          />
          <SettingsLink
            icon="🔔"
            label="Notifications"
            description="In-app notification preferences"
            onPress={() => router.push("/notification-preferences")}
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

        {userId ? <LibraryImportPanel userId={userId} /> : null}
        {userId ? <SeriesImportPanel userId={userId} /> : null}

        <View className="rounded-2xl border border-rust/30 bg-surface p-4 mb-6">
          <Text className="text-base font-semibold text-rust">Delete account</Text>
          <Text className="mt-2 text-sm text-ink-muted">
            Permanently delete your account and all associated data. This cannot be undone.
          </Text>
          {!deleteOpen ? (
            <Pressable
              onPress={() => setDeleteOpen(true)}
              className="mt-4 rounded-xl border border-rust/40 px-4 py-3 active:opacity-80"
            >
              <Text className="text-center font-semibold text-rust">Delete my account</Text>
            </Pressable>
          ) : (
            <View className="mt-4 gap-3">
              <Text className="text-sm text-ink-muted">Type DELETE to confirm.</Text>
              <TextInput
                value={deleteConfirm}
                onChangeText={setDeleteConfirm}
                autoCapitalize="characters"
                placeholder="DELETE"
                className="rounded-xl border border-brand-border bg-background px-3 py-3 text-base text-ink"
              />
              <Pressable
                onPress={() => void handleDeleteAccount()}
                disabled={deleting}
                className="rounded-xl bg-rust px-4 py-3 active:opacity-80"
              >
                <Text className="text-center font-semibold text-white">
                  {deleting ? "Deleting…" : "Permanently delete account"}
                </Text>
              </Pressable>
              <Pressable onPress={() => setDeleteOpen(false)}>
                <Text className="text-center text-sm text-puce-red">Cancel</Text>
              </Pressable>
            </View>
          )}
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
