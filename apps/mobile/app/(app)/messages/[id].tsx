import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActionSheetIOS,
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
import { MESSAGE_QUICK_REACTIONS } from "../../../src/constants/messageReactions";
import {
  useConversation,
  useDeleteMessage,
  useMarkConversationRead,
  useSendMessage,
  useThreadMessages,
  useToggleMessageReaction,
} from "../../../src/hooks/useMessages";
import {
  conversationDisplayName,
  messageReplySnippet,
} from "../../../src/services/messages";
import { pickImageFromLibrary, uploadMessageAttachment } from "../../../src/services/storage";
import { showContentActions } from "../../../src/components/ContentActions";
import { containsProfanity } from "../../../src/utils/profanity";
import { useAuthStore } from "../../../src/store/authStore";
import type { MessageReactionSummary, MessageWithSender } from "../../../src/types";

function profileName(message: MessageWithSender): string {
  return (
    message.sender.display_name?.trim() ||
    message.sender.username?.trim() ||
    "Reader"
  );
}

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
  const [replyTo, setReplyTo] = useState<MessageWithSender | null>(null);

  const conversation = useConversation(conversationId);
  const messages = useThreadMessages(conversationId);
  const send = useSendMessage(conversationId);
  const toggleReaction = useToggleMessageReaction(conversationId);
  const deleteMsg = useDeleteMessage(conversationId);
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
    if (containsProfanity(body)) {
      Alert.alert("Language not allowed", "Please remove profanity before sending.");
      return;
    }
    setDraft("");
    const pendingAttachment = attachment;
    const pendingReplyTo = replyTo?.id ?? null;
    setAttachment(null);
    setReplyTo(null);
    await send.mutateAsync({
      body,
      attachmentUrl: pendingAttachment,
      replyToId: pendingReplyTo,
    });
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }

  function openMessageActions(message: MessageWithSender) {
    const mine = message.sender_id === userId;
    const options = mine
      ? ["Reply", "Delete", ...MESSAGE_QUICK_REACTIONS, "Cancel"]
      : ["Reply", "Report", ...MESSAGE_QUICK_REACTIONS, "Cancel"];
    const cancelButtonIndex = options.length - 1;

    const onSelect = (index: number) => {
      if (index === cancelButtonIndex) return;
      if (index === 0) {
        setReplyTo(message);
        return;
      }
      if (!mine && index === 1) {
        showContentActions({
          contentType: "message",
          contentId: message.id,
          reportedUserId: message.sender_id,
          reportedUserName: profileName(message),
        });
        return;
      }
      if (mine && index === 1) {
        Alert.alert("Delete message?", "This cannot be undone.", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => void deleteMsg.mutateAsync(message.id),
          },
        ]);
        return;
      }
      const reactionIndex = mine ? index - 2 : index - 2;
      const emoji = MESSAGE_QUICK_REACTIONS[reactionIndex];
      if (!emoji) return;
      void toggleReaction.mutateAsync({ messageId: message.id, emoji });
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex, destructiveButtonIndex: mine ? 1 : undefined },
        onSelect
      );
      return;
    }

    Alert.alert("Message", undefined, [
      { text: "Reply", onPress: () => setReplyTo(message) },
      ...(!mine
        ? [
            {
              text: "Report",
              onPress: () =>
                showContentActions({
                  contentType: "message",
                  contentId: message.id,
                  reportedUserId: message.sender_id,
                  reportedUserName: profileName(message),
                }),
            },
          ]
        : []),
      ...(mine
        ? [
            {
              text: "Delete",
              style: "destructive" as const,
              onPress: () =>
                Alert.alert("Delete message?", "This cannot be undone.", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => void deleteMsg.mutateAsync(message.id),
                  },
                ]),
            },
          ]
        : []),
      ...MESSAGE_QUICK_REACTIONS.map((emoji) => ({
        text: emoji,
        onPress: () => void toggleReaction.mutateAsync({ messageId: message.id, emoji }),
      })),
      { text: "Cancel", style: "cancel" as const },
    ]);
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
                <Pressable
                  onLongPress={() => openMessageActions(item)}
                  className={`max-w-[80%] ${mine ? "self-end" : "self-start"}`}
                >
                  {item.reply_to ? (
                    <View
                      className={`mb-1 rounded-xl border-l-2 px-2 py-1 ${
                        mine ? "border-white/70 bg-white/10" : "border-puce-red/60 bg-primary/10"
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-semibold ${mine ? "text-white" : "text-ink"}`}
                      >
                        {profileName({
                          ...item,
                          sender: item.reply_to.sender,
                        })}
                      </Text>
                      <Text
                        className={`text-[11px] ${mine ? "text-white/80" : "text-ink/70"}`}
                        numberOfLines={1}
                      >
                        {messageReplySnippet(item.reply_to)}
                      </Text>
                    </View>
                  ) : null}
                  <View
                    className={`rounded-2xl px-3 py-2 ${
                      mine ? "bg-puce-red" : "bg-primary/20"
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
                  {item.reactions?.length ? (
                    <View className={`mt-1 flex-row flex-wrap gap-1 ${mine ? "justify-end" : ""}`}>
                      {item.reactions.map((reaction: MessageReactionSummary) => (
                        <Pressable
                          key={reaction.emoji}
                          onPress={() =>
                            void toggleReaction.mutateAsync({
                              messageId: item.id,
                              emoji: reaction.emoji,
                            })
                          }
                          className={`rounded-full border px-2 py-0.5 ${
                            reaction.viewer_reacted
                              ? "border-puce-red/40 bg-puce-red/10"
                              : "border-brand-border bg-surface"
                          }`}
                        >
                          <Text className="text-xs">
                            {reaction.emoji} {reaction.count}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </Pressable>
              );
            }}
          />

          <View
            className="border-t border-brand-border bg-surface px-3 pt-2"
            style={{ paddingBottom: insets.bottom + 8 }}
          >
            {replyTo ? (
              <View className="mb-2 rounded-xl border border-brand-border bg-background px-3 py-2">
                <View className="flex-row items-start justify-between gap-2">
                  <View className="min-w-0 flex-1">
                    <Text className="text-xs font-semibold text-ink">
                      Replying to {profileName(replyTo)}
                    </Text>
                    <Text className="text-xs text-ink/70" numberOfLines={1}>
                      {messageReplySnippet(replyTo)}
                    </Text>
                  </View>
                  <Pressable onPress={() => setReplyTo(null)}>
                    <Text className="text-xs text-rust">Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
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
