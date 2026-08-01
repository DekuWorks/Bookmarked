import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { LoadingState } from "../../src/components/LoadingState";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { useProfile } from "../../src/hooks/useProfile";
import { updateNotificationPreferences } from "../../src/services/notifications";
import { useAuthStore } from "../../src/store/authStore";
import { TAB_BAR_SPACE } from "../../src/navigation/TabBarScroll";

type PrefKey =
  | "notify_messages"
  | "notify_follows"
  | "notify_feed"
  | "notify_likes"
  | "notify_comments";

const PREF_OPTIONS: { key: PrefKey; label: string; description: string }[] = [
  {
    key: "notify_messages",
    label: "Messages",
    description: "When someone sends you a direct or group message.",
  },
  {
    key: "notify_follows",
    label: "New followers",
    description: "When another reader follows you.",
  },
  {
    key: "notify_feed",
    label: "Post notifications",
    description: "When a reader whose posts you follow publishes a new post.",
  },
  {
    key: "notify_likes",
    label: "Likes",
    description: "When someone likes your post, review, or comment.",
  },
  {
    key: "notify_comments",
    label: "Comments and replies",
    description: "When someone comments on your post or replies to you.",
  },
];

export default function NotificationPreferencesScreen() {
  const userId = useAuthStore((s) => s.user?.id);
  const { data: profile } = useProfile();
  const [values, setValues] = useState<Record<PrefKey, boolean> | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!profile) return;
    setValues({
      notify_messages: profile.notify_messages ?? true,
      notify_follows: profile.notify_follows ?? true,
      notify_feed: profile.notify_feed ?? true,
      notify_likes: profile.notify_likes ?? true,
      notify_comments: profile.notify_comments ?? true,
    });
  }, [profile]);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  async function savePrefs(next: Record<PrefKey, boolean>, previous: Record<PrefKey, boolean>) {
    if (!userId) return;
    setSaving(true);
    const result = await updateNotificationPreferences(userId, next);
    setSaving(false);

    if (result.error) {
      setValues(previous);
      Alert.alert("Couldn't save", result.error);
      return;
    }

    setSavedMessage("Saved");
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSavedMessage(null), 2000);
  }

  function togglePref(key: PrefKey) {
    if (!values) return;
    const previous = values;
    const next = { ...values, [key]: !values[key] };
    setValues(next);
    void savePrefs(next, previous);
  }

  if (!profile || !values) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Notifications" />
        <LoadingState message="Loading notification preferences…" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Notifications" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE }}>
        <Text className="text-sm text-ink-muted mb-4">
          Choose what you want to hear about in the app.
        </Text>
        {savedMessage ? (
          <Text className="text-sm font-semibold text-primary-dark mb-3">{savedMessage}</Text>
        ) : null}

        {PREF_OPTIONS.map(({ key, label, description }) => (
          <View
            key={key}
            className="mb-3 rounded-2xl border border-brand-border bg-surface p-4"
          >
            <View className="flex-row items-start justify-between gap-4">
              <View className="flex-1">
                <Text className="font-semibold text-ink">{label}</Text>
                <Text className="mt-1 text-sm text-ink-muted">{description}</Text>
              </View>
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: values[key], disabled: saving }}
                disabled={saving}
                onPress={() => togglePref(key)}
                className={`mt-1 h-7 w-12 rounded-full ${values[key] ? "bg-puce-red" : "bg-brand-border"}`}
              >
                <View
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-surface ${
                    values[key] ? "right-0.5" : "left-0.5"
                  }`}
                />
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
