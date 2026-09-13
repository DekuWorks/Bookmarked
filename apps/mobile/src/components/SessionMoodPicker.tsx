import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  type CustomMoodTag,
  isBuiltinMoodTag,
  mergeMoodTags,
} from "../../../../packages/utils/customMoodTags";
import {
  renameSessionMood,
  sessionMoodsFromRow,
  toggleSessionMood,
} from "../../../../packages/utils/sessionMoods";
import { archiveMoodTag, createMoodTag, listMyMoodTags, renameMoodTag } from "../services/moodTags";
import { useAuthStore } from "../store/authStore";

type Props = {
  value?: string | null;
  values?: string[] | null;
  onChange: (moods: string[]) => void;
  disabled?: boolean;
};

export function SessionMoodPicker({ value, values, onChange, disabled }: Props) {
  const userId = useAuthStore((s) => s.user?.id);
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState<CustomMoodTag[]>([]);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = values?.length ? values : sessionMoodsFromRow({ mood: value ?? null });

  useEffect(() => {
    if (!userId) return;
    void listMyMoodTags(userId)
      .then(setCustom)
      .catch((error) => console.error("[mood-tags] load failed:", error));
  }, [userId]);

  const tags = mergeMoodTags(custom);
  const label =
    selected.length === 0
      ? "Mood Tags"
      : selected.length === 1
        ? `Mood Tags · ${selected[0]}`
        : `Mood Tags · ${selected.length} selected`;

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
    onChange(toggleSessionMood(selected, result.tag.name));
  }

  function editCustom(tag: CustomMoodTag) {
    Alert.alert(tag.name, "Edit this private mood tag.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Rename",
        onPress: () => {
          if (typeof Alert.prompt !== "function") {
            Alert.alert("Rename unavailable", "Use create after deleting this tag.");
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
                    onChange(renameSessionMood(selected, tag.name, result.tag.name));
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
            onChange(selected.filter((item) => item.toLowerCase() !== tag.name.toLowerCase()));
          });
        },
      },
    ]);
  }

  return (
    <View>
      <Pressable
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Mood Tags"
        accessibilityState={{ disabled, expanded: open }}
        onPress={() => setOpen(true)}
        className={`min-h-[44px] flex-row items-center justify-between rounded-xl border border-brand-border bg-background px-3 ${
          disabled ? "opacity-50" : "active:opacity-80"
        }`}
      >
        <Text className="flex-1 text-sm font-medium text-ink">{label}</Text>
        <Text className="text-ink-muted">▾</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 bg-background px-4 pt-5">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-puce-red">Mood Tags</Text>
            <Pressable onPress={() => setOpen(false)} className="min-h-[44px] justify-center">
              <Text className="text-sm font-semibold text-primary-dark">Done</Text>
            </Pressable>
          </View>
          <ScrollView>
            {tags.map((feeling) => {
              const active = selected.some((item) => item.toLowerCase() === feeling.toLowerCase());
              const customTag = custom.find(
                (tag) => !tag.archivedAt && tag.name.toLowerCase() === feeling.toLowerCase()
              );
              const canEdit = Boolean(customTag) && !isBuiltinMoodTag(feeling);
              return (
                <Pressable
                  key={feeling}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={feeling}
                  onPress={() => onChange(toggleSessionMood(selected, feeling))}
                  onLongPress={() => {
                    if (canEdit && customTag) editCustom(customTag);
                  }}
                  className={`mb-1 min-h-[44px] flex-row items-center justify-between rounded-xl px-3 ${
                    active ? "bg-puce-red/15" : "bg-transparent"
                  }`}
                >
                  <Text className={`text-sm ${active ? "font-semibold text-puce-red" : "text-ink"}`}>
                    {feeling}
                  </Text>
                  {active ? <Text className="text-puce-red">✓</Text> : null}
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setCreating((next) => !next)}
              className="mt-3 min-h-[44px] justify-center"
            >
              <Text className="text-sm font-semibold text-primary-dark">
                {creating ? "Cancel" : "Create Custom Mood Tag"}
              </Text>
            </Pressable>
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
          </ScrollView>
        </View>
      </Modal>
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

export function SessionMoodChips({ moods }: { moods: string[] }) {
  if (!moods.length) return null;
  return (
    <View className="flex-row flex-wrap gap-1.5">
      {moods.map((mood) => (
        <SessionMoodChip key={mood} mood={mood} />
      ))}
    </View>
  );
}
