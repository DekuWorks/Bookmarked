import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "./Button";
import { CustomShelfIconPicker } from "./CustomShelfIconPicker";
import { SHELF_VISIBILITY_OPTIONS } from "../constants/shelfVisibility";
import {
  DEFAULT_CUSTOM_SHELF_ICON_KEY,
  resolveCustomShelfIconKey,
  type CustomShelfIconKey,
} from "../constants/shelfIcons";
import { invalidateCustomShelfViews } from "../services/customShelfCache";
import { updateCustomShelf } from "../services/customShelves";
import type { ShelfVisibility, UserShelf } from "../types";

type ShelfLike = Pick<UserShelf, "id" | "name" | "genre" | "visibility"> & {
  icon_key?: string | null;
};

type Props = {
  open: boolean;
  shelf: ShelfLike | null;
  onClose: () => void;
  onSaved?: (shelf: UserShelf) => void;
};

export function EditCustomShelfSheet({ open, shelf, onClose, onSaved }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("");
  const [visibility, setVisibility] = useState<ShelfVisibility>("public");
  const [iconKey, setIconKey] = useState<CustomShelfIconKey>(DEFAULT_CUSTOM_SHELF_ICON_KEY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !shelf) return;
    setName(shelf.name);
    setGenre(shelf.genre ?? "");
    setVisibility(shelf.visibility);
    setIconKey(resolveCustomShelfIconKey(shelf.icon_key));
  }, [open, shelf]);

  async function handleSave() {
    if (!shelf) return;
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert("Name required", "Enter a shelf name.");
      return;
    }
    setSaving(true);
    const result = await updateCustomShelf(shelf.id, {
      name: trimmed,
      genre: genre.trim() || null,
      visibility,
      icon_key: iconKey,
    });
    setSaving(false);
    if (result.error) {
      Alert.alert("Couldn't save shelf", result.error);
      return;
    }
    await invalidateCustomShelfViews(queryClient);
    if (result.shelf) onSaved?.(result.shelf);
    onClose();
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-end bg-black/50"
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      >
        <Pressable
          className="max-h-[85%] rounded-t-2xl border border-brand-border bg-surface px-4 pb-8 pt-4"
          onPress={(e) => e.stopPropagation()}
          accessibilityViewIsModal
          accessibilityLabel="Edit shelf"
        >
          <Text className="mb-3 text-lg font-semibold text-puce-red">Edit shelf</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Shelf name"
              placeholderTextColor="#A99DAE"
              maxLength={80}
              className="mb-3 min-h-[44px] rounded-xl border border-brand-border bg-background px-3 py-2 text-ink"
            />
            <TextInput
              value={genre}
              onChangeText={setGenre}
              placeholder="Genre (optional)"
              placeholderTextColor="#A99DAE"
              maxLength={80}
              className="mb-3 min-h-[44px] rounded-xl border border-brand-border bg-background px-3 py-2 text-ink"
            />
            <CustomShelfIconPicker value={iconKey} onChange={setIconKey} disabled={saving} />
            <Text className="mb-2 text-xs text-ink-muted">Privacy</Text>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {SHELF_VISIBILITY_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setVisibility(option.value)}
                  className={`min-h-[44px] justify-center rounded-full px-3 py-1.5 ${
                    visibility === option.value ? "bg-puce-red" : "bg-primary/15"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      visibility === option.value ? "text-white" : "text-puce-red"
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button title="Cancel" variant="ghost" onPress={onClose} disabled={saving} />
              </View>
              <View className="flex-1">
                <Button title="Save" variant="secondary" loading={saving} onPress={() => void handleSave()} />
              </View>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
