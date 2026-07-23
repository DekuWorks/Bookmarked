import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "../Avatar";
import { CircleAvatarPicker } from "../CircleAvatarPicker";
import { SegmentedTabs } from "../SegmentedTabs";
import {
  createDirectConversation,
  createGroupConversation,
  searchProfilesForMessaging,
} from "../../services/messages";
import { uploadGroupAvatar } from "../../services/storage";
import type { MessageProfile } from "../../types";
import type { PickedImage } from "../../services/storage";

type Props = {
  visible: boolean;
  currentUserId: string;
  onClose: () => void;
};

type Mode = "direct" | "group";

const MODES: { id: Mode; label: string }[] = [
  { id: "direct", label: "Direct" },
  { id: "group", label: "Group" },
];

function profileName(profile: MessageProfile): string {
  return profile.display_name?.trim() || profile.username?.trim() || "Reader";
}

export function NewMessageSheet({ visible, currentUserId, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("direct");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MessageProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedDirect, setSelectedDirect] = useState<MessageProfile | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<MessageProfile[]>([]);
  const [groupTitle, setGroupTitle] = useState("");
  const [groupAvatar, setGroupAvatar] = useState<PickedImage | null>(null);
  const [groupAvatarPreview, setGroupAvatarPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setMode("direct");
    setQuery("");
    setResults([]);
    setSelectedDirect(null);
    setSelectedGroup([]);
    setGroupTitle("");
    setGroupAvatar(null);
    setGroupAvatarPreview(null);
    setError(null);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    const handle = setTimeout(() => {
      void searchProfilesForMessaging(trimmed, currentUserId)
        .then(setResults)
        .finally(() => setSearching(false));
    }, 250);

    return () => clearTimeout(handle);
  }, [query, currentUserId, visible]);

  function toggleGroupMember(profile: MessageProfile) {
    setSelectedGroup((current) => {
      const exists = current.some((p) => p.id === profile.id);
      if (exists) return current.filter((p) => p.id !== profile.id);
      return [...current, profile];
    });
  }

  function handleClose() {
    if (submitting) return;
    onClose();
  }

  async function handleDirectMessage() {
    if (!selectedDirect) {
      setError("Select a reader to message.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await createDirectConversation(selectedDirect.id);
    setSubmitting(false);

    if (result.error || !result.conversationId) {
      setError(result.error ?? "Could not start conversation.");
      return;
    }

    onClose();
    router.push(`/messages/${result.conversationId}`);
  }

  async function handleCreateGroup() {
    if (!groupTitle.trim()) {
      setError("Enter a group name.");
      return;
    }
    if (selectedGroup.length < 2) {
      setError("Select at least two other readers.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await createGroupConversation(
      groupTitle,
      selectedGroup.map((p) => p.id)
    );
    setSubmitting(false);

    if (result.error || !result.conversationId) {
      setError(result.error ?? "Could not create group.");
      return;
    }

    if (groupAvatar) {
      const avatarResult = await uploadGroupAvatar(result.conversationId, groupAvatar);
      if (avatarResult.error) {
        Alert.alert("Group created", avatarResult.error);
      }
    }

    onClose();
    router.push(`/messages/${result.conversationId}`);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View
          className="max-h-[90%] rounded-t-2xl bg-surface"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <View className="flex-row items-center justify-between border-b border-brand-border px-4 py-3">
            <Text className="text-lg font-bold text-puce-red">New message</Text>
            <Pressable onPress={handleClose} disabled={submitting}>
              <Text className="text-sm text-ink-muted">Close</Text>
            </Pressable>
          </View>

          <ScrollView className="px-4 pt-4" keyboardShouldPersistTaps="handled">
            <SegmentedTabs options={MODES} value={mode} onChange={setMode} />

            {mode === "group" ? (
              <View className="mt-4">
                <CircleAvatarPicker
                  imageUrl={groupAvatarPreview}
                  fallbackLabel={groupTitle || "Group"}
                  disabled={submitting}
                  onImagePicked={(image) => {
                    setGroupAvatar(image);
                    setGroupAvatarPreview(image.uri);
                  }}
                  onRemove={() => {
                    setGroupAvatar(null);
                    setGroupAvatarPreview(null);
                  }}
                />
                <Text className="mb-1 text-sm font-medium text-ink">Group name</Text>
                <TextInput
                  value={groupTitle}
                  onChangeText={setGroupTitle}
                  placeholder="Book club friends, reading buddies…"
                  placeholderTextColor="#A99DAE"
                  className="mb-4 rounded-xl border border-brand-border bg-background px-3 py-2 text-ink"
                />
              </View>
            ) : null}

            <Text className="mb-1 text-sm font-medium text-ink">Search readers</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by username or display name"
              placeholderTextColor="#A99DAE"
              className="mb-3 rounded-xl border border-brand-border bg-background px-3 py-2 text-ink"
            />

            {searching ? (
              <ActivityIndicator className="my-4" />
            ) : query.trim().length >= 2 && results.length === 0 ? (
              <Text className="mb-4 text-sm text-ink-muted">No readers found.</Text>
            ) : (
              <View className="mb-4 gap-2">
                {results.map((profile) => {
                  const selected =
                    mode === "direct"
                      ? selectedDirect?.id === profile.id
                      : selectedGroup.some((p) => p.id === profile.id);

                  return (
                    <Pressable
                      key={profile.id}
                      onPress={() => {
                        if (mode === "direct") {
                          setSelectedDirect(profile);
                        } else {
                          toggleGroupMember(profile);
                        }
                        setError(null);
                      }}
                      className={`flex-row items-center gap-3 rounded-xl border px-3 py-2 active:opacity-80 ${
                        selected ? "border-puce-red bg-primary/10" : "border-brand-border bg-background"
                      }`}
                    >
                      <Avatar url={profile.avatar_url} name={profileName(profile)} size={40} />
                      <View className="min-w-0 flex-1">
                        <Text className="font-medium text-ink" numberOfLines={1}>
                          {profileName(profile)}
                        </Text>
                        {profile.username ? (
                          <Text className="text-xs text-ink-muted" numberOfLines={1}>
                            @{profile.username}
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {mode === "group" && selectedGroup.length > 0 ? (
              <View className="mb-4 flex-row flex-wrap gap-2">
                {selectedGroup.map((profile) => (
                  <Pressable
                    key={profile.id}
                    onPress={() => toggleGroupMember(profile)}
                    className="flex-row items-center gap-1 rounded-full bg-primary/15 px-3 py-1 active:opacity-80"
                  >
                    <Text className="text-xs font-medium text-puce-red">
                      {profileName(profile)} ×
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {error ? <Text className="mb-4 text-sm text-rust">{error}</Text> : null}

            <Pressable
              onPress={() =>
                void (mode === "direct" ? handleDirectMessage() : handleCreateGroup())
              }
              disabled={
                submitting ||
                (mode === "direct" ? !selectedDirect : !groupTitle.trim() || selectedGroup.length < 2)
              }
              className={`mb-4 items-center rounded-full py-3 ${
                submitting ||
                (mode === "direct" ? !selectedDirect : !groupTitle.trim() || selectedGroup.length < 2)
                  ? "bg-primary/40"
                  : "bg-puce-red"
              }`}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-semibold text-white">
                  {mode === "direct" ? "Message" : "Create group"}
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
