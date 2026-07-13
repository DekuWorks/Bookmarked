import { useState } from "react";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Button } from "../../src/components/Button";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { createPost } from "../../src/services/posts";

const MAX = 1000;

export default function ComposeRoute() {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function share() {
    if (!body.trim()) return;
    setSaving(true);
    const result = await createPost(body);
    setSaving(false);
    if (result.error) {
      Alert.alert("Couldn't post", result.error);
      return;
    }
    setBody("");
    router.replace("/");
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Create" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View className="rounded-2xl border border-brand-border bg-surface p-4">
          <Text className="mb-2 text-sm font-semibold text-puce-red">Share a post</Text>
          <TextInput
            value={body}
            onChangeText={(t) => setBody(t.slice(0, MAX))}
            placeholder="What are you reading?"
            placeholderTextColor="#A99DAE"
            multiline
            className="min-h-[120px] rounded-xl border border-brand-border bg-background px-3 py-3 text-base text-ink"
            style={{ textAlignVertical: "top" }}
          />
          <View className="mt-2 flex-row items-center justify-between">
            <Text className="text-xs text-ink-muted">
              {body.length}/{MAX}
            </Text>
            <View className="w-32">
              <Button title="Share" onPress={share} loading={saving} disabled={!body.trim()} />
            </View>
          </View>
          <Text className="mt-2 text-xs text-ink-muted">
            Image, GIF, @mentions, and drafts are coming soon.
          </Text>
        </View>

        <View className="rounded-2xl border border-brand-border bg-surface p-4">
          <Text className="mb-3 text-sm font-semibold text-puce-red">Quick actions</Text>
          <View className="gap-2">
            <Pressable
              onPress={() => router.push("/search")}
              className="flex-row items-center gap-3 rounded-xl bg-primary/10 px-4 py-3 active:opacity-80"
            >
              <Text className="text-lg">📚</Text>
              <Text className="flex-1 font-medium text-puce-red">Add a book to your shelves</Text>
              <Text className="text-ink-muted">›</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/clubs/new")}
              className="flex-row items-center gap-3 rounded-xl bg-primary/10 px-4 py-3 active:opacity-80"
            >
              <Text className="text-lg">♣️</Text>
              <Text className="flex-1 font-medium text-puce-red">Start a book club</Text>
              <Text className="text-ink-muted">›</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
