import { useEffect, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import {
  type CustomMoodTag,
  isBuiltinMoodTag,
  mergeMoodTags,
} from "../../../../packages/utils/customMoodTags";
import { archiveMoodTag, createMoodTag, listMyMoodTags, renameMoodTag } from "../services/moodTags";
import { useAuthStore } from "../store/authStore";

type Props = {
  value: string | null;
  onChange: (mood: string | null) => void;
  disabled?: boolean;
};

export function SessionMoodPicker({ value, onChange, disabled }: Props) {
  const userId = useAuthStore((s) => s.user?.id);
  const [custom, setCustom] = useState<CustomMoodTag[]>([]);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    void listMyMoodTags(userId)
      .then(setCustom)
      .catch((error) => console.error("[mood-tags] load failed:", error));
  }, [userId]);

  const tags = mergeMoodTags(custom);

  async function handleCreate() {
    if (!userId) return;
    setSaving(true);
    const result = await createMoodTag(userId, draft);
    setSaving(false);
    if (result.error || !result.tag) {
      Alert.alert("Couldn't create mood", result.error ?? "Please try again.");
      return;
    }
    setCustom((prev) => [...prev, result.tag!]);
    setDraft("");
    setCreating(false);
    onChange(result.tag.name);
  }

  function editCustom(tag: CustomMoodTag) {
    Alert.alert(tag.name, "Edit this private mood tag.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Rename",
        onPress: () => {
          if (typeof Alert.prompt !== "function") {
            Alert.alert("Rename unavailable", "Use the create field after deleting this tag.");
            return;
          }
          Alert.prompt(
            "Rename mood",
            "32 characters or fewer.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Save",
                onPress: (next?: string) => {
                  void renameMoodTag(tag.id, String(next ?? "")).then((result) => {
                    if (result.error || !result.tag) {
                      Alert.alert("Couldn't rename", result.error ?? "Please try again.");
                      return;
                    }
                    setCustom((prev) => prev.map((row) => (row.id === tag.id ? result.tag! : row)));
                    if (value === tag.name) onChange(result.tag.name);
                  });
                },
              },
            ],
            "plain-text",
            tag.name
          );
        },
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void archiveMoodTag(tag.id).then((result) => {
            if (result.error) {
              Alert.alert("Couldn't delete", result.error);
              return;
            }
            setCustom((prev) =>
              prev.map((row) =>
                row.id === tag.id ? { ...row, archivedAt: new Date().toISOString() } : row
              )
            );
            if (value === tag.name) onChange(null);
          });
        },
      },
    ]);
  }

  return (
    <View>
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-medium text-ink-muted">Mood</Text>
        <Pressable
          disabled={disabled}
          onPress={() => setCreating((open) => !open)}
          className="min-h-[32px] justify-center"
        >
          <Text className="text-xs font-semibold text-primary-dark">
            {creating ? "Cancel" : "+ Create"}
          </Text>
        </Pressable>
      </View>
      {creating ? (
        <View className="mt-2 flex-row items-center gap-2">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            maxLength={32}
            placeholder="Name this mood"
            placeholderTextColor="#A99DAE"
            className="min-h-[40px] flex-1 rounded-xl border border-brand-border bg-background px-3 text-sm text-ink"
          />
          <Pressable
            disabled={saving || !draft.trim()}
            onPress={() => void handleCreate()}
            className="min-h-[40px] justify-center rounded-xl bg-puce-red px-3"
          >
            <Text className="text-sm font-semibold text-white">Save</Text>
          </Pressable>
        </View>
      ) : null}
      <View className="mt-1.5 flex-row flex-wrap gap-1.5">
        {tags.map((feeling) => {
          const active = value === feeling;
          const customTag = custom.find(
            (tag) => !tag.archivedAt && tag.name.toLowerCase() === feeling.toLowerCase()
          );
          const canEdit = Boolean(customTag) && !isBuiltinMoodTag(feeling);
          return (
            <Pressable
              key={feeling}
              disabled={disabled}
              onPress={() => onChange(active ? null : feeling)}
              onLongPress={() => {
                if (canEdit && customTag) editCustom(customTag);
              }}
              className={`rounded-full border px-2.5 py-1 ${
                active ? "border-puce-red bg-puce-red" : "border-brand-border bg-background"
              } ${disabled ? "opacity-50" : "active:opacity-80"}`}
            >
              <Text className={`text-xs font-medium ${active ? "text-white" : "text-ink-muted"}`}>
                {feeling}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function SessionMoodChip({ mood }: { mood: string }) {
  return (
    <View className="self-start rounded-full bg-primary/15 px-2 py-0.5">
      <Text className="text-xs font-medium text-puce-red">{mood}</Text>
    </View>
  );
}
