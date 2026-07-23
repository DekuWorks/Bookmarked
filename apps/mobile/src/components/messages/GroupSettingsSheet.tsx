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
import {
  addGroupMembers,
  leaveConversation,
  removeGroupMember,
  renameGroupConversation,
  searchProfilesForMessaging,
} from "../../services/messages";
import { removeGroupAvatar, uploadGroupAvatar } from "../../services/storage";
import type { ConversationWithParticipants, MessageProfile } from "../../types";

type Props = {
  visible: boolean;
  conversation: ConversationWithParticipants;
  currentUserId: string;
  onClose: () => void;
  onUpdated: () => void;
};

function profileName(profile: MessageProfile): string {
  return profile.display_name?.trim() || profile.username?.trim() || "Reader";
}

export function GroupSettingsSheet({
  visible,
  conversation,
  currentUserId,
  onClose,
  onUpdated,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [title, setTitle] = useState(conversation.title ?? "");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MessageProfile[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const isOwner = conversation.participants.some(
    (p) => p.user_id === currentUserId && p.role === "owner"
  );

  useEffect(() => {
    if (!visible) return;
    setTitle(conversation.title ?? "");
    setQuery("");
    setSearchResults([]);
    setSelectedIds([]);
  }, [visible, conversation.title]);

  useEffect(() => {
    if (!visible || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      void searchProfilesForMessaging(query, currentUserId).then((results) => {
        const memberIds = new Set(conversation.participants.map((p) => p.user_id));
        setSearchResults(results.filter((p) => !memberIds.has(p.id)));
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [visible, query, currentUserId, conversation.participants]);

  async function handleRename() {
    setBusy(true);
    const result = await renameGroupConversation(conversation.id, title);
    setBusy(false);
    if (result.error) {
      Alert.alert("Couldn't rename group", result.error);
      return;
    }
    onUpdated();
    Alert.alert("Group renamed");
  }

  async function handleLeave() {
    Alert.alert(
      "Leave group?",
      "You will no longer see its messages.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            const result = await leaveConversation(conversation.id);
            setBusy(false);
            if (result.error) {
              Alert.alert("Couldn't leave group", result.error);
              return;
            }
            onClose();
            router.replace("/messages");
          },
        },
      ]
    );
  }

  async function handleAddMembers() {
    if (!selectedIds.length) return;
    setBusy(true);
    const result = await addGroupMembers(conversation.id, selectedIds);
    setBusy(false);
    if (result.error) {
      Alert.alert("Couldn't add members", result.error);
      return;
    }
    setSelectedIds([]);
    setQuery("");
    onUpdated();
    Alert.alert(`Added ${result.added ?? selectedIds.length} member(s)`);
  }

  async function handleRemoveMember(userId: string, name: string) {
    Alert.alert(`Remove ${name}?`, "They will no longer see group messages.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          const result = await removeGroupMember(conversation.id, userId);
          setBusy(false);
          if (result.error) {
            Alert.alert("Couldn't remove member", result.error);
            return;
          }
          onUpdated();
        },
      },
    ]);
  }

  function toggleSelected(userId: string) {
    setSelectedIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View
          className="max-h-[85%] rounded-t-2xl bg-surface"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <View className="flex-row items-center justify-between border-b border-brand-border px-4 py-3">
            <Text className="text-lg font-bold text-puce-red">Group settings</Text>
            <Pressable onPress={onClose} disabled={busy}>
              <Text className="text-sm text-ink-muted">Close</Text>
            </Pressable>
          </View>

          <ScrollView className="px-4 pt-4" keyboardShouldPersistTaps="handled">
            {isOwner ? (
              <View className="mb-6">
                <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Group
                </Text>
                <CircleAvatarPicker
                  imageUrl={conversation.avatar_url}
                  fallbackLabel={title}
                  disabled={busy}
                  onImagePicked={async (image) => {
                    setBusy(true);
                    const result = await uploadGroupAvatar(conversation.id, image);
                    setBusy(false);
                    if (result.error) {
                      Alert.alert("Couldn't update photo", result.error);
                      return;
                    }
                    onUpdated();
                  }}
                  onRemove={async () => {
                    setBusy(true);
                    const result = await removeGroupAvatar(conversation.id);
                    setBusy(false);
                    if (result.error) {
                      Alert.alert("Couldn't remove photo", result.error);
                      return;
                    }
                    onUpdated();
                  }}
                />
                <Text className="mb-1 text-sm font-medium text-ink">Group name</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Book club friends, reading buddies…"
                  placeholderTextColor="#A99DAE"
                  editable={!busy}
                  className="mb-2 rounded-xl border border-brand-border bg-background px-3 py-2 text-ink"
                />
                <Pressable
                  onPress={() => void handleRename()}
                  disabled={busy || !title.trim()}
                  className={`items-center rounded-full py-2 ${
                    busy || !title.trim() ? "bg-primary/40" : "bg-puce-red"
                  }`}
                >
                  <Text className="font-semibold text-white">Save name</Text>
                </Pressable>
              </View>
            ) : null}

            <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Members ({conversation.participants.length})
            </Text>
            <View className="mb-6 overflow-hidden rounded-xl border border-brand-border">
              {conversation.participants.map((participant, index) => {
                const name = profileName(participant.profile);
                const canRemove =
                  isOwner &&
                  participant.user_id !== currentUserId &&
                  participant.role !== "owner";

                return (
                  <View
                    key={participant.id}
                    className={`flex-row items-center justify-between gap-2 px-3 py-2 ${
                      index > 0 ? "border-t border-brand-border" : ""
                    }`}
                  >
                    <View className="min-w-0 flex-1 flex-row items-center gap-2">
                      <Avatar
                        url={participant.profile.avatar_url}
                        name={name}
                        size={36}
                      />
                      <View className="min-w-0 flex-1">
                        <Text className="text-sm font-medium text-ink" numberOfLines={1}>
                          {name}
                          {participant.user_id === currentUserId ? " (you)" : ""}
                        </Text>
                        {participant.role === "owner" ? (
                          <Text className="text-xs text-ink-muted">Owner</Text>
                        ) : null}
                      </View>
                    </View>
                    {canRemove ? (
                      <Pressable
                        onPress={() => void handleRemoveMember(participant.user_id, name)}
                        disabled={busy}
                      >
                        <Text className="text-xs font-medium text-rust">Remove</Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
            </View>

            {isOwner ? (
              <View className="mb-6">
                <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Add members
                </Text>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search readers…"
                  placeholderTextColor="#A99DAE"
                  editable={!busy}
                  className="mb-2 rounded-xl border border-brand-border bg-background px-3 py-2 text-ink"
                />
                {searchResults.length > 0 ? (
                  <View className="mb-2 overflow-hidden rounded-xl border border-brand-border">
                    {searchResults.map((profile, index) => (
                      <Pressable
                        key={profile.id}
                        onPress={() => toggleSelected(profile.id)}
                        className={`flex-row items-center gap-2 px-3 py-2 active:bg-background ${
                          index > 0 ? "border-t border-brand-border" : ""
                        }`}
                      >
                        <View
                          className={`h-4 w-4 rounded border ${
                            selectedIds.includes(profile.id)
                              ? "border-puce-red bg-puce-red"
                              : "border-brand-border"
                          }`}
                        />
                        <Text className="text-sm text-ink">{profileName(profile)}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : query.trim().length >= 2 ? (
                  <Text className="mb-2 text-xs text-ink-muted">No readers found.</Text>
                ) : null}
                <Pressable
                  onPress={() => void handleAddMembers()}
                  disabled={busy || !selectedIds.length}
                  className={`items-center rounded-full py-2 ${
                    busy || !selectedIds.length ? "bg-primary/40" : "bg-primary/20"
                  }`}
                >
                  <Text className="font-semibold text-puce-red">Add selected</Text>
                </Pressable>
              </View>
            ) : null}

            <Pressable
              onPress={() => void handleLeave()}
              disabled={busy}
              className="mb-4 items-center rounded-full border border-brand-border py-3 active:opacity-80"
            >
              {busy ? (
                <ActivityIndicator />
              ) : (
                <Text className="font-semibold text-rust">Leave group</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
