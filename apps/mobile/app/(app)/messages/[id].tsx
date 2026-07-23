import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AttachmentImage } from "../../../src/components/AttachmentImage";
import { Avatar } from "../../../src/components/Avatar";
import { GifPicker } from "../../../src/components/GifPicker";
import { LoadingState } from "../../../src/components/LoadingState";
import { ScreenHeader } from "../../../src/components/ScreenHeader";
import {
  useConversation,
  useMarkConversationRead,
  useSendMessage,
  useThreadMessages,
} from "../../../src/hooks/useMessages";
import { conversationDisplayName } from "../../../src/services/messages";
import { pickImageFromLibrary, uploadMessageAttachment } from "../../../src/services/storage";
import { useAuthStore } from "../../../src/store/authStore";

export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = String(id);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id);
  const listRef = useRef<FlatList>(null);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [gifOpen, setGifOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const conversation = useConversation(conversationId);
  const messages = useThreadMessages(conversationId);
  const send = useSendMessage(conversationId);
  const markRead = useMarkConversationRead();

  useEffect(() => {
    if (conversationId) markRead.mutate(conversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const title = conversation.data
    ? conversationDisplayName(conversation.data, userId as string)
    : "Conversation";

  const isGroup = conversation.data?.type === "group";
  const groupAvatarUrl = isGroup ? conversation.data?.avatar_url : null;

  const peerUsername =
    conversation.data?.type === "direct"
      ? conversation.data.participants
          .find((p) => p.user_id !== userId)
          ?.profile.username?.trim() || null
      : null;

  // Header occupies insets.top + ~58px; offset the keyboard-avoider by that so
  // the docked compose bar rises cleanly with the keyboard on iOS.
  const headerHeight = insets.top + 58;

  async function attachImage() {
    const result = await pickImageFromLibrary();
    if (result.canceled) return;
    if (result.error || !result.image) {
      Alert.alert("Couldn't attach image", result.error ?? "Please try again.");
      return;
    }
    setUploading(true);
    const upload = await uploadMessageAttachment(conversationId, result.image);
    setUploading(false);
    if (upload.error || !upload.url) {
      Alert.alert("Upload failed", upload.error ?? "Please try again.");
      return;
    }
    setAttachment(upload.url);
  }

  async function submit() {
    const body = draft.trim();
    if (!body && !attachment) return;
    setDraft("");
    const pendingAttachment = attachment;
    setAttachment(null);
    await send.mutateAsync({ body, attachmentUrl: pendingAttachment });
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }

  const canSend = (draft.trim().length > 0 || Boolean(attachment)) && !uploading && !send.isPending;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={title}
        onTitlePress={
          peerUsername
            ? () => router.push(`/reader/${peerUsername}`)
            : undefined
        }
        left={
          isGroup ? (
            <Avatar url={groupAvatarUrl} name={title} size={32} />
          ) : undefined
        }
      />
      {messages.isLoading ? (
        <LoadingState message="Loading messages…" />
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={headerHeight}
        >
          <FlatList
            ref={listRef}
            data={messages.data ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 8 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => {
              const mine = item.sender_id === userId;
              return (
                <View
                  className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                    mine ? "self-end bg-puce-red" : "self-start bg-primary/20"
                  }`}
                >
                  {item.attachment_url ? (
                    <View className="mb-1 w-52">
                      <AttachmentImage url={item.attachment_url} compact />
                    </View>
                  ) : null}
                  {item.body ? (
                    <Text className={mine ? "text-white" : "text-ink"}>{item.body}</Text>
                  ) : null}
                </View>
              );
            }}
          />

          <View
            className="border-t border-brand-border bg-surface px-3 pt-2"
            style={{ paddingBottom: insets.bottom + 8 }}
          >
            {attachment ? (
              <View className="mb-2 flex-row items-center gap-2">
                <Image
                  source={{ uri: attachment }}
                  style={{ width: 56, height: 56, borderRadius: 8 }}
                />
                <Pressable onPress={() => setAttachment(null)}>
                  <Text className="text-xs text-rust">Remove</Text>
                </Pressable>
              </View>
            ) : null}
            <View className="flex-row items-end gap-2">
              <Pressable
                onPress={attachImage}
                disabled={uploading || Boolean(attachment)}
                className="h-10 w-10 items-center justify-center rounded-full bg-primary/15 active:opacity-70"
              >
                <Text className="text-base">🖼️</Text>
              </Pressable>
              <Pressable
                onPress={() => setGifOpen(true)}
                disabled={Boolean(attachment)}
                className="h-10 items-center justify-center rounded-full bg-primary/15 px-3 active:opacity-70"
              >
                <Text className="text-xs font-bold text-puce-red">GIF</Text>
              </Pressable>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Message…"
                placeholderTextColor="#A99DAE"
                multiline
                className="max-h-28 flex-1 rounded-2xl border border-brand-border bg-background px-3 py-2 text-base text-ink"
              />
              <Pressable
                onPress={submit}
                disabled={!canSend}
                className={`h-10 items-center justify-center rounded-full px-4 ${
                  canSend ? "bg-puce-red" : "bg-primary/40"
                }`}
              >
                <Text className="font-semibold text-white">{uploading ? "…" : "Send"}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      <GifPicker visible={gifOpen} onClose={() => setGifOpen(false)} onSelect={setAttachment} />
    </View>
  );
}
