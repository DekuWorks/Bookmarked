import { useEffect, useMemo, useState } from "react";
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
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "./Avatar";
import { SharePreviewCard } from "./messages/SharePreviewCard";
import {
  createDirectConversation,
  getConversations,
  searchProfilesForMessaging,
  sendMessage,
} from "../services/messages";
import { createPost } from "../services/posts";
import { supabase } from "../services/supabase";
import { SANS_FONT, SANS_FONT_BOLD, SANS_FONT_MEDIUM } from "../constants/theme";
import { useThemeColors } from "../store/themeStore";
import {
  buildMessageSharePayload,
  type ShareComposerPayload,
} from "../../../../packages/utils/sharePreview";

export type MobileSharePayload = ShareComposerPayload;

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type Props = {
  visible: boolean;
  currentUserId: string;
  payload: MobileSharePayload | null;
  onClose: () => void;
  onSharedToFeed?: () => void;
};

export function ShareContentSheet({
  visible,
  currentUserId,
  payload,
  onClose,
  onSharedToFeed,
}: Props) {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"choose" | "message">("choose");
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileRow[]>([]);
  const [followers, setFollowers] = useState<ProfileRow[]>([]);
  const [recent, setRecent] = useState<ProfileRow[]>([]);
  const [selected, setSelected] = useState<ProfileRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setMode("choose");
    setNote("");
    setQuery("");
    setSelected(null);
    setResults([]);

    void getConversations(currentUserId)
      .then((rows) => {
        const profiles: ProfileRow[] = [];
        for (const row of rows.slice(0, 8)) {
          const peer = row.participants?.find((p) => p.user_id !== currentUserId)?.profile;
          if (peer) {
            profiles.push({
              id: peer.id,
              username: peer.username,
              display_name: peer.display_name,
              avatar_url: peer.avatar_url,
            });
          }
        }
        setRecent(profiles);
      })
      .catch(() => setRecent([]));

    void supabase
      .from("follows")
      .select("follower_id")
      .eq("following_id", currentUserId)
      .limit(12)
      .then(async ({ data }) => {
        const ids = (data ?? []).map((row) => row.follower_id as string);
        if (!ids.length) {
          setFollowers([]);
          return;
        }
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", ids);
        setFollowers((profiles as ProfileRow[]) ?? []);
      });
  }, [visible, currentUserId]);

  useEffect(() => {
    if (!visible || mode !== "message") return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      void searchProfilesForMessaging(trimmed, currentUserId).then((rows) =>
        setResults(
          rows.map((row) => ({
            id: row.id,
            username: row.username,
            display_name: row.display_name,
            avatar_url: row.avatar_url,
          }))
        )
      );
    }, 250);
    return () => clearTimeout(handle);
  }, [query, currentUserId, visible, mode]);

  const picker = useMemo(() => {
    if (query.trim().length >= 2) return results;
    if (followers.length) return followers;
    return recent;
  }, [query, results, followers, recent]);

  if (!payload) return null;

  const previewPayload = buildMessageSharePayload(payload);

  async function shareToFeed() {
    const share = payload;
    if (!share) return;
    setSubmitting(true);
    const body = note.trim() ? `${note.trim()}\n\n${share.body}` : share.body;
    const result = await createPost({
      body,
      bookId: share.bookId ?? null,
      imageUrl: share.imageUrl ?? null,
    });
    setSubmitting(false);
    if (result.error) {
      Alert.alert("Couldn't share", result.error);
      return;
    }
    Alert.alert("Shared", "Posted to your feed.");
    onSharedToFeed?.();
    onClose();
  }

  async function shareToMessage() {
    const share = payload;
    if (!share) return;
    if (!selected) {
      Alert.alert("Pick a reader", "Select someone to message.");
      return;
    }
    setSubmitting(true);
    const convo = await createDirectConversation(selected.id);
    if (convo.error || !convo.conversationId) {
      setSubmitting(false);
      Alert.alert("Couldn't share", convo.error ?? "Could not start conversation.");
      return;
    }
    const sent = await sendMessage(
      convo.conversationId,
      note.trim(),
      null,
      null,
      share
    );
    setSubmitting(false);
    if (sent.error) {
      Alert.alert("Couldn't send", sent.error);
      return;
    }
    Alert.alert("Delivered", "Message sent.");
    onClose();
    router.push(`/messages/${convo.conversationId}`);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          className="max-h-[85%] rounded-t-3xl px-5 pt-5"
          style={{ backgroundColor: colors.surface, paddingBottom: insets.bottom + 24 }}
          onPress={(event) => event.stopPropagation()}
        >
          <Text className="text-xl" style={{ fontFamily: SANS_FONT_BOLD, color: colors.puceRed }}>
            Share
          </Text>
          <View className="mt-3">
            <Text style={{ fontFamily: SANS_FONT_MEDIUM, color: colors.inkMuted, marginBottom: 8 }}>
              Preview
            </Text>
            <SharePreviewCard payload={previewPayload} viewerId={currentUserId} />
          </View>

          {mode === "choose" ? (
            <View className="mt-4 gap-3">
              <Pressable
                onPress={() => void shareToFeed()}
                disabled={submitting}
                className="items-center rounded-full bg-puce-red px-4 py-3 active:opacity-80"
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ fontFamily: SANS_FONT_BOLD, color: "#fff" }}>Share → Feed</Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => setMode("message")}
                className="items-center rounded-full border border-brand-border px-4 py-3 active:opacity-80"
              >
                <Text style={{ fontFamily: SANS_FONT_BOLD, color: colors.ink }}>Share → Message</Text>
              </Pressable>
            </View>
          ) : (
            <View className="mt-4 gap-3">
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="I think you'll love this."
                placeholderTextColor={colors.inkMuted}
                className="rounded-xl border border-brand-border px-3 py-3"
                style={{ fontFamily: SANS_FONT, color: colors.ink }}
              />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search readers"
                placeholderTextColor={colors.inkMuted}
                className="rounded-xl border border-brand-border px-3 py-3"
                style={{ fontFamily: SANS_FONT, color: colors.ink }}
              />
              <FlatList
                data={picker}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 220 }}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => setSelected(item)}
                    className="mb-2 flex-row items-center gap-3 rounded-xl px-2 py-2"
                    style={{
                      backgroundColor:
                        selected?.id === item.id ? `${colors.primary}33` : "transparent",
                    }}
                  >
                    <Avatar
                      url={item.avatar_url}
                      name={item.display_name ?? item.username}
                      size={36}
                    />
                    <Text style={{ fontFamily: SANS_FONT_MEDIUM, color: colors.ink }}>
                      {item.display_name?.trim() || item.username || "Reader"}
                    </Text>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <Text style={{ fontFamily: SANS_FONT, color: colors.inkMuted }}>
                    No readers found.
                  </Text>
                }
              />
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setMode("choose")}
                  className="flex-1 items-center rounded-full border border-brand-border py-3"
                >
                  <Text style={{ fontFamily: SANS_FONT_BOLD, color: colors.ink }}>Back</Text>
                </Pressable>
                <Pressable
                  onPress={() => void shareToMessage()}
                  disabled={submitting}
                  className="flex-1 items-center rounded-full bg-puce-red py-3"
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ fontFamily: SANS_FONT_BOLD, color: "#fff" }}>Send</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
