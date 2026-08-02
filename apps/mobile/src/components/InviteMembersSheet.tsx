import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { useSendInvitations } from "../hooks/useClubs";
import { searchProfilesForMessaging } from "../services/messages";
import type { MessageProfile } from "../types";

type Props = {
  visible: boolean;
  clubId: string;
  currentUserId: string;
  excludeUserIds?: string[];
  onClose: () => void;
  onInvited?: () => void;
};

function profileName(profile: MessageProfile): string {
  return profile.display_name?.trim() || profile.username?.trim() || "Reader";
}

export function InviteMembersSheet({
  visible,
  clubId,
  currentUserId,
  excludeUserIds = [],
  onClose,
  onInvited,
}: Props) {
  const insets = useSafeAreaInsets();
  const sendInvitations = useSendInvitations(clubId);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MessageProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<MessageProfile[]>([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setQuery("");
    setResults([]);
    setSelected([]);
    setMessage("");
  }, [visible]);

  const excludeKey = excludeUserIds.join(",");

  useEffect(() => {
    if (!visible) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    const blocked = new Set([currentUserId, ...excludeKey.split(",").filter(Boolean)]);
    setSearching(true);
    const handle = setTimeout(() => {
      void searchProfilesForMessaging(trimmed, currentUserId)
        .then((rows) => setResults(rows.filter((row) => !blocked.has(row.id))))
        .finally(() => setSearching(false));
    }, 250);

    return () => clearTimeout(handle);
  }, [query, currentUserId, visible, excludeKey]);

  function toggle(profile: MessageProfile) {
    setSelected((current) => {
      const exists = current.some((item) => item.id === profile.id);
      if (exists) return current.filter((item) => item.id !== profile.id);
      return [...current, profile];
    });
  }

  async function handleSend() {
    if (!selected.length) {
      Alert.alert("Select readers", "Choose at least one person to invite.");
      return;
    }

    setSubmitting(true);
    const result = await sendInvitations.mutateAsync({
      inviteeIds: selected.map((profile) => profile.id),
      message: message.trim() || null,
    });
    setSubmitting(false);

    if (result.error) {
      Alert.alert("Couldn't send invites", result.error);
      return;
    }

    onInvited?.();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View
          className="max-h-[88%] rounded-t-3xl bg-background px-5 pt-5"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-puce-red">Invite members</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close invite sheet"
              onPress={onClose}
              className="min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-primary/15 active:opacity-80"
            >
              <Text className="text-sm font-semibold text-puce-red">Close</Text>
            </Pressable>
          </View>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or username"
            placeholderTextColor="#A99DAE"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Search readers to invite"
            className="mb-3 min-h-[44px] rounded-full border border-brand-border bg-surface px-4 py-3 text-base text-ink"
          />

          {selected.length ? (
            <Text className="mb-2 text-xs font-semibold text-ink-muted">
              {selected.length} selected
            </Text>
          ) : null}

          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 220 }}
            ListEmptyComponent={
              <Text className="py-6 text-center text-sm text-ink-muted">
                {searching
                  ? "Searching…"
                  : query.trim().length < 2
                    ? "Type at least 2 characters to search."
                    : "No readers found."}
              </Text>
            }
            renderItem={({ item }) => {
              const isSelected = selected.some((profile) => profile.id === item.id);
              return (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={`Invite ${profileName(item)}`}
                  onPress={() => toggle(item)}
                  className="mb-2 min-h-[44px] flex-row items-center gap-3 rounded-xl border border-brand-border bg-surface px-3 py-2 active:opacity-80"
                >
                  <Avatar url={item.avatar_url} name={profileName(item)} size={36} />
                  <View className="flex-1">
                    <Text className="font-medium text-ink" numberOfLines={1}>
                      {profileName(item)}
                    </Text>
                    {item.username ? (
                      <Text className="text-xs text-ink-muted">@{item.username}</Text>
                    ) : null}
                  </View>
                  <Text className="text-sm font-semibold text-puce-red">
                    {isSelected ? "Selected" : "Select"}
                  </Text>
                </Pressable>
              );
            }}
          />

          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Optional invite message"
            placeholderTextColor="#A99DAE"
            multiline
            accessibilityLabel="Optional invite message"
            className="mb-3 mt-3 min-h-[72px] rounded-2xl border border-brand-border bg-surface px-4 py-3 text-base text-ink"
            style={{ textAlignVertical: "top" }}
          />

          <Button
            title={submitting ? "Sending…" : "Send invites"}
            variant="primary"
            loading={submitting || sendInvitations.isPending}
            disabled={!selected.length}
            onPress={() => void handleSend()}
          />

          {searching ? (
            <View className="absolute right-8 top-24">
              <ActivityIndicator color="#642F37" />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
