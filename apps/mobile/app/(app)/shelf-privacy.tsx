import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button } from "../../src/components/Button";
import { LoadingState } from "../../src/components/LoadingState";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { ShelfTitleRow } from "../../src/components/ShelfTitleRow";
import { SHELF_CONFIG } from "../../src/constants/shelves";
import { SHELF_VISIBILITY_OPTIONS } from "../../src/constants/shelfVisibility";
import { useProfile } from "../../src/hooks/useProfile";
import {
  createCustomShelf,
  listUserCustomShelves,
  updateCustomShelfVisibility,
} from "../../src/services/customShelves";
import { supabase } from "../../src/services/supabase";
import { useAuthStore } from "../../src/store/authStore";
import type { ShelfStatus, ShelfVisibility, UserShelf } from "../../src/types";
import { validateShelfVisibility } from "../../../../packages/utils/profileValidation";

function visibilityForProfile(
  profile: {
    shelf_visibility_want_to_read?: ShelfVisibility | null;
    shelf_visibility_currently_reading?: ShelfVisibility | null;
    shelf_visibility_read?: ShelfVisibility | null;
  },
  status: ShelfStatus
): ShelfVisibility {
  switch (status) {
    case "want_to_read":
      return profile.shelf_visibility_want_to_read ?? "public";
    case "currently_reading":
      return profile.shelf_visibility_currently_reading ?? "public";
    case "read":
      return profile.shelf_visibility_read ?? "public";
  }
}

export default function ShelfPrivacyScreen() {
  const userId = useAuthStore((s) => s.user?.id);
  const { data: profile, refetch } = useProfile();
  const [values, setValues] = useState<Record<ShelfStatus, ShelfVisibility> | null>(null);
  const [customShelves, setCustomShelves] = useState<UserShelf[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, ShelfVisibility>>({});
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newVisibility, setNewVisibility] = useState<ShelfVisibility>("public");
  const [creating, setCreating] = useState(false);

  const refreshCustomShelves = useCallback(async () => {
    if (!userId) return;
    const shelves = await listUserCustomShelves(userId);
    setCustomShelves(shelves);
    setCustomValues(
      Object.fromEntries(shelves.map((shelf) => [shelf.id, shelf.visibility]))
    );
  }, [userId]);

  useEffect(() => {
    if (!profile) return;
    setValues({
      want_to_read: visibilityForProfile(profile, "want_to_read"),
      currently_reading: visibilityForProfile(profile, "currently_reading"),
      read: visibilityForProfile(profile, "read"),
    });
  }, [profile]);

  useEffect(() => {
    void refreshCustomShelves().catch((err) => {
      console.error("[shelf-privacy] custom shelves load failed:", err);
    });
  }, [refreshCustomShelves]);

  async function save() {
    if (!userId || !values) return;

    for (const shelf of SHELF_CONFIG) {
      const result = validateShelfVisibility(values[shelf.status]);
      if (!result.ok) {
        Alert.alert("Invalid setting", result.error);
        return;
      }
    }

    for (const shelf of customShelves) {
      const visibility = customValues[shelf.id] ?? shelf.visibility;
      const result = validateShelfVisibility(visibility);
      if (!result.ok) {
        Alert.alert("Invalid setting", result.error);
        return;
      }
    }

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        shelf_visibility_want_to_read: values.want_to_read,
        shelf_visibility_currently_reading: values.currently_reading,
        shelf_visibility_read: values.read,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      setSaving(false);
      Alert.alert("Couldn't save", error.message);
      return;
    }

    const results = await Promise.all(
      customShelves.map((shelf) => {
        const visibility = customValues[shelf.id] ?? shelf.visibility;
        if (visibility === shelf.visibility) return Promise.resolve({ error: undefined });
        return updateCustomShelfVisibility(shelf.id, visibility);
      })
    );
    const customError = results.find((r) => r.error)?.error;
    setSaving(false);

    if (customError) {
      Alert.alert("Couldn't save", customError);
      return;
    }

    await Promise.all([refetch(), refreshCustomShelves()]);
    Alert.alert("Saved", "Shelf privacy updated.");
  }

  async function handleCreate() {
    if (!userId) return;
    const trimmed = newName.trim();
    if (!trimmed) {
      Alert.alert("Name required", "Enter a shelf name.");
      return;
    }
    setCreating(true);
    const result = await createCustomShelf(userId, {
      name: trimmed,
      visibility: newVisibility,
    });
    setCreating(false);
    if (result.error) {
      Alert.alert("Couldn't create shelf", result.error);
      return;
    }
    setNewName("");
    setNewVisibility("public");
    setCreateOpen(false);
    await refreshCustomShelves();
  }

  if (!profile || !values) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Shelf privacy" />
        <LoadingState message="Loading shelf privacy…" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Shelf privacy" />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-sm text-ink-muted mb-4">
          Choose who can see each shelf on your public profile and library.
        </Text>

        {SHELF_CONFIG.map((shelf) => (
          <VisibilityRow
            key={shelf.status}
            titleNode={<ShelfTitleRow id={shelf.status} title={shelf.title} />}
            subtitle={shelf.description}
            value={values[shelf.status]}
            onChange={(next) =>
              setValues((prev) => (prev ? { ...prev, [shelf.status]: next } : prev))
            }
          />
        ))}

        {customShelves.map((shelf) => (
          <VisibilityRow
            key={shelf.id}
            title={`📚 ${shelf.name}`}
            subtitle={shelf.genre ? `Genre: ${shelf.genre}` : "Custom collection"}
            value={customValues[shelf.id] ?? shelf.visibility}
            onChange={(next) =>
              setCustomValues((prev) => ({ ...prev, [shelf.id]: next }))
            }
          />
        ))}

        {createOpen ? (
          <View className="mt-2 rounded-2xl border border-brand-border bg-surface p-4">
            <Text className="font-semibold text-ink mb-2">New custom shelf</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Shelf name"
              placeholderTextColor="#A99DAE"
              maxLength={80}
              className="min-h-[44px] rounded-xl border border-brand-border bg-background px-3 py-2 text-ink mb-3"
            />
            <Text className="text-xs text-ink-muted mb-2">Privacy</Text>
            <View className="flex-row flex-wrap gap-2 mb-3">
              {SHELF_VISIBILITY_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setNewVisibility(option.value)}
                  className={`rounded-full px-3 py-1.5 ${
                    newVisibility === option.value
                      ? "bg-puce-red"
                      : "bg-primary/15"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      newVisibility === option.value ? "text-white" : "text-puce-red"
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button
                  title="Cancel"
                  variant="ghost"
                  onPress={() => {
                    setCreateOpen(false);
                    setNewName("");
                    setNewVisibility("public");
                  }}
                  disabled={creating}
                />
              </View>
              <View className="flex-1">
                <Button
                  title="Create"
                  variant="secondary"
                  loading={creating}
                  onPress={() => void handleCreate()}
                />
              </View>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => setCreateOpen(true)}
            className="mt-2 rounded-2xl border border-dashed border-brand-border bg-surface px-4 py-3 active:opacity-80"
          >
            <Text className="text-center font-medium text-primary-dark">
              + Create custom shelf
            </Text>
          </Pressable>
        )}

        <View className="mt-6">
          <Button
            title="Save shelf privacy"
            variant="secondary"
            loading={saving}
            onPress={() => void save()}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function VisibilityRow({
  title,
  titleNode,
  subtitle,
  value,
  onChange,
}: {
  title?: string;
  titleNode?: ReactNode;
  subtitle: string;
  value: ShelfVisibility;
  onChange: (next: ShelfVisibility) => void;
}) {
  return (
    <View className="mb-3 rounded-2xl border border-brand-border bg-surface p-4">
      {titleNode ?? <Text className="font-semibold text-ink">{title}</Text>}
      <Text className="text-xs text-ink-muted mt-0.5 mb-3">{subtitle}</Text>
      <View className="flex-row flex-wrap gap-2">
        {SHELF_VISIBILITY_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: value === option.value }}
            className={`rounded-full px-3 py-1.5 ${
              value === option.value ? "bg-puce-red" : "bg-primary/15"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                value === option.value ? "text-white" : "text-puce-red"
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
